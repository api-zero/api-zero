import type { RequestContext } from "./context";
import { ApiError } from "./error";
import type { HttpMethod, RetryConfig } from "./types";

const DEFAULT_SAFE_RETRY_METHODS: HttpMethod[] = ["GET", "PUT", "DELETE"];

/**
 * Checks if the request method is eligible for automatic retry.
 */
export function isMethodRetryable(
  method: HttpMethod | undefined,
  config: RetryConfig,
): boolean {
  if (!method) return true;
  if (config.retryUnsafeMethods) return true;
  if (config.retryMethods && config.retryMethods.length > 0) {
    return config.retryMethods.includes(method);
  }
  return DEFAULT_SAFE_RETRY_METHODS.includes(method);
}

/**
 * Parses Retry-After header into milliseconds.
 * Supports decimal/integer seconds (e.g., '120') or HTTP-date (e.g., 'Fri, 31 Dec 2026 23:59:59 GMT').
 */
export function parseRetryAfter(headerValue?: string): number | undefined {
  if (!headerValue) return undefined;

  const trimmed = headerValue.trim();

  // Try parsing as integer / decimal seconds
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  // Try parsing as HTTP-Date
  const dateTimestamp = Date.parse(trimmed);
  if (!Number.isNaN(dateTimestamp)) {
    const diff = dateTimestamp - Date.now();
    return Math.max(0, diff);
  }

  return undefined;
}

/**
 * Calculates retry delay based on attempt count, backoff policy, jitter, and Retry-After header.
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  error: ApiError,
): number {
  const maxDelay = config.maxDelay ?? 30000;
  const baseDelay = config.delay;

  // 1. Check for Retry-After header if respectRetryAfter is enabled (default: true)
  if (config.respectRetryAfter !== false) {
    const retryAfterHeader =
      error.response?.headers?.get("retry-after") ??
      error.request?.headers?.["retry-after"];
    const retryAfterMs = parseRetryAfter(retryAfterHeader);
    if (retryAfterMs !== undefined) {
      return Math.min(maxDelay, Math.max(0, retryAfterMs));
    }
  }

  // 2. Compute backoff delay
  let calculatedDelay: number;
  if (typeof config.backoff === "function") {
    calculatedDelay = config.backoff(attempt, error);
  } else if (config.backoff === "linear") {
    calculatedDelay = baseDelay * attempt;
  } else {
    // Default: Exponential backoff
    calculatedDelay = baseDelay * 2 ** (attempt - 1);
  }

  // 3. Apply maximum delay cap
  calculatedDelay = Math.min(maxDelay, Math.max(0, calculatedDelay));

  // 4. Apply Jitter (default: true)
  // Equal jitter: (0.5 + Math.random() * 0.5) * delay
  if (config.jitter !== false && calculatedDelay > 0) {
    const jitterFactor = 0.5 + Math.random() * 0.5;
    calculatedDelay = Math.round(calculatedDelay * jitterFactor);
  }

  return Math.min(maxDelay, calculatedDelay);
}

/**
 * Wait for `ms` milliseconds, immediately aborting if `signal` fires.
 */
export function sleepWithSignal(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  if (ms <= 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        ApiError.from("Request aborted", {
          status: 0,
          statusText: "Aborted",
          isAborted: true,
        }),
      );
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    const cleanup = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (signal && onAbort) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    onAbort = () => {
      cleanup();
      reject(
        ApiError.from("Request aborted", {
          status: 0,
          statusText: "Aborted",
          isAborted: true,
        }),
      );
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
  });
}

/**
 * Executes a function with intelligent retry policy.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  config: RetryConfig | false | undefined,
  requestContext?: RequestContext,
): Promise<T> {
  if (!config || config.attempts <= 1) {
    return fn(1);
  }

  let attempt = 1;
  while (true) {
    try {
      return await fn(attempt);
    } catch (rawError: unknown) {
      const error =
        rawError instanceof ApiError
          ? rawError
          : ApiError.from(
              rawError instanceof Error ? rawError.message : "Request failed",
              {
                request: requestContext,
                cause: rawError instanceof Error ? rawError : undefined,
                attempt,
              },
            );

      // If attempts exhausted, throw final error
      if (attempt >= config.attempts) {
        throw error;
      }

      // Check if user abort -> never retry aborts
      if (error.isAborted || requestContext?.signal?.aborted) {
        throw error;
      }

      // Check if method is retryable
      const method = requestContext?.method;
      if (!isMethodRetryable(method, config) && !config.retryCondition) {
        throw error;
      }

      // Check retry condition
      const shouldRetry = config.retryCondition
        ? config.retryCondition(error, attempt)
        : error.isRetryable();

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay
      const delay = calculateRetryDelay(attempt, config, error);

      // Trigger onRetry callback if provided
      if (config.onRetry) {
        config.onRetry({
          attempt,
          maxAttempts: config.attempts,
          error,
          delay,
          request: requestContext,
        });
      }

      // Sleep before next attempt (cancellable by signal)
      await sleepWithSignal(delay, requestContext?.signal);

      attempt++;
    }
  }
}
