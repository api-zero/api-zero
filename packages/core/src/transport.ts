import type { RequestContext } from "./context";
import { ApiError } from "./error";

export interface TransportResponse<T = unknown> {
  rawResponse?: Response;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

export interface Transport {
  send(context: RequestContext): Promise<TransportResponse>;
}

/**
 * Universal base64 encoder with browser btoa and Node Buffer support.
 */
export function toBase64(str: string): string {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(str);
  }
  const globalBuffer = (globalThis as any).Buffer;
  if (
    typeof globalBuffer !== "undefined" &&
    typeof globalBuffer.from === "function"
  ) {
    return globalBuffer.from(str).toString("base64");
  }
  throw new Error("No base64 implementation available in this environment");
}

/**
 * Find a header key case-insensitively.
 */
export function findHeaderKey(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  return Object.keys(headers).find((k) => k.toLowerCase() === lower);
}

/**
 * Extract headers from native Fetch Headers object to a plain Record.
 */
export function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

export interface CompositeSignal {
  signal: AbortSignal;
  cleanup: () => void;
  isTimeout: () => boolean;
  isAborted: () => boolean;
}

/**
 * Creates a composite abort signal combining a timeout timer and an optional caller signal.
 * Ensures clean event listener and timer cleanup.
 */
export function createCompositeSignal(
  timeoutMs: number,
  callerSignal?: AbortSignal,
): CompositeSignal {
  const controller = new AbortController();
  let timedOut = false;
  let abortedByCaller = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  let onAbort: (() => void) | undefined;

  if (callerSignal?.aborted) {
    abortedByCaller = true;
    controller.abort();
  } else if (callerSignal) {
    onAbort = () => {
      abortedByCaller = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      controller.abort();
    };
    callerSignal.addEventListener("abort", onAbort, { once: true });
  }

  if (!abortedByCaller && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (callerSignal && onAbort) {
      callerSignal.removeEventListener("abort", onAbort);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    isTimeout: () => timedOut,
    isAborted: () => abortedByCaller,
  };
}

/**
 * Prepare body for Fetch request and set/remove appropriate headers.
 */
export function prepareFetchBody(
  body: unknown,
  headers: Record<string, string>,
): BodyInit | undefined {
  if (body == null) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    if (body instanceof FormData) {
      const ctKey = findHeaderKey(headers, "Content-Type");
      if (ctKey) delete headers[ctKey];
    }
    return body;
  }

  if (!findHeaderKey(headers, "Content-Type")) {
    headers["Content-Type"] = "application/json";
  }
  return JSON.stringify(body);
}

/**
 * Parse response body based on responseType and empty body status codes.
 */
export async function parseResponseBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "arrayBuffer",
): Promise<unknown> {
  const isEmptyBody =
    response.status === 204 ||
    response.status === 205 ||
    response.headers.get("content-length") === "0";

  if (isEmptyBody) {
    return null;
  }

  switch (responseType) {
    case "text":
      return response.text();
    case "blob":
      return response.blob();
    case "arrayBuffer":
      return response.arrayBuffer();
    default: {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
  }
}

/**
 * Standard Fetch-based HTTP transport.
 * Supported across Browser, Node 22+, and Edge runtimes.
 */
export class FetchTransport implements Transport {
  async send(context: RequestContext): Promise<TransportResponse> {
    const headers: Record<string, string> = { ...context.headers };
    const body = prepareFetchBody(context.body, headers);

    const composite = createCompositeSignal(context.timeout, context.signal);

    const fetchOptions: RequestInit = {
      method: context.method,
      headers,
      credentials: context.credentials,
      signal: composite.signal,
      body,
    };

    if (composite.isAborted() || context.signal?.aborted) {
      composite.cleanup();
      throw ApiError.from("Request aborted", {
        status: 0,
        statusText: "Aborted",
        request: context,
        isAborted: true,
        attempt: context.attempt,
      });
    }

    try {
      const response = await fetch(context.url, fetchOptions);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          try {
            errorData = await response.text();
          } catch {
            errorData = undefined;
          }
        }

        throw ApiError.from(
          response.statusText ||
            `Request failed with status ${response.status}`,
          {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            request: context,
            response,
            attempt: context.attempt,
          },
        );
      }

      const data = await parseResponseBody(response, context.responseType);
      const responseHeaders = extractHeaders(response.headers);

      return {
        rawResponse: response,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
      };
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      const isAbortError =
        error instanceof Error && error.name === "AbortError";

      if (isAbortError) {
        if (composite.isAborted() || context.signal?.aborted) {
          throw ApiError.from("Request aborted", {
            status: 0,
            statusText: "Aborted",
            request: context,
            cause: error instanceof Error ? error : undefined,
            isAborted: true,
            attempt: context.attempt,
          });
        }
        if (composite.isTimeout()) {
          throw ApiError.from("Request timeout", {
            status: 408,
            statusText: "Timeout",
            request: context,
            cause: error instanceof Error ? error : undefined,
            isTimeout: true,
            attempt: context.attempt,
          });
        }
      }

      const message = error instanceof Error ? error.message : "Network Error";
      throw ApiError.from(message, {
        status: 0,
        statusText: "Network Error",
        request: context,
        cause: error instanceof Error ? error : undefined,
        isNetworkError: true,
        attempt: context.attempt,
      });
    } finally {
      composite.cleanup();
    }
  }
}

/**
 * XMLHttpRequest-based transport for browser environments.
 * Selected when upload or download progress tracking is requested.
 */
export class XhrTransport implements Transport {
  async send(context: RequestContext): Promise<TransportResponse> {
    if (typeof XMLHttpRequest === "undefined") {
      throw ApiError.from(
        "XHR transport is not supported in this runtime environment (e.g. Node.js or Edge workers). Use standard Fetch transport.",
        {
          status: 0,
          statusText: "Unsupported Runtime",
          request: context,
          isNetworkError: true,
          attempt: context.attempt,
        },
      );
    }

    return new Promise<TransportResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(context.method, context.url);

      const headers = { ...context.headers };

      if (context.headers) {
        Object.entries(context.headers).forEach(([key, value]) => {
          if (
            key.toLowerCase() === "content-type" &&
            context.body instanceof FormData
          ) {
            return;
          }
          xhr.setRequestHeader(key, value);
        });
      }

      if (context.credentials === "include") {
        xhr.withCredentials = true;
      }

      if (context.timeout > 0) {
        xhr.timeout = context.timeout;
      }

      if (context.options.onUploadProgress && xhr.upload) {
        xhr.upload.onprogress = context.options.onUploadProgress;
      }

      if (context.options.onDownloadProgress) {
        xhr.onprogress = context.options.onDownloadProgress;
      }

      xhr.onload = () => {
        const rawHeaders = xhr.getAllResponseHeaders() || "";
        const responseHeaders: Record<string, string> = {};
        rawHeaders
          .trim()
          .split(/[\r\n]+/)
          .forEach((line) => {
            const parts = line.split(": ");
            const header = parts.shift();
            const value = parts.join(": ");
            if (header) {
              responseHeaders[header.toLowerCase()] = value;
            }
          });

        if (xhr.status >= 200 && xhr.status < 300) {
          let data: unknown;
          const responseType = context.responseType;
          if (responseType === "json") {
            try {
              data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
              data = xhr.responseText;
            }
          } else {
            data = xhr.response;
          }

          resolve({
            status: xhr.status,
            statusText: xhr.statusText,
            headers: responseHeaders,
            data,
          });
        } else {
          let errorData: unknown;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = xhr.responseText;
          }
          reject(
            ApiError.from(
              xhr.statusText || `Request failed with status ${xhr.status}`,
              {
                status: xhr.status,
                statusText: xhr.statusText,
                data: errorData,
                request: context,
                attempt: context.attempt,
              },
            ),
          );
        }
      };

      xhr.onerror = () => {
        reject(
          ApiError.from("Network Error", {
            status: 0,
            statusText: "Network Error",
            request: context,
            isNetworkError: true,
            attempt: context.attempt,
          }),
        );
      };

      xhr.ontimeout = () => {
        reject(
          ApiError.from("Request timeout", {
            status: 408,
            statusText: "Timeout",
            request: context,
            isTimeout: true,
            attempt: context.attempt,
          }),
        );
      };

      xhr.onabort = () => {
        reject(
          ApiError.from("Request aborted", {
            status: 0,
            statusText: "Aborted",
            request: context,
            isAborted: true,
            attempt: context.attempt,
          }),
        );
      };

      let onAbort: (() => void) | undefined;
      if (context.signal) {
        if (context.signal.aborted) {
          xhr.abort();
          return;
        }
        onAbort = () => xhr.abort();
        context.signal.addEventListener("abort", onAbort, { once: true });
      }

      const body = context.body;
      if (
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
      ) {
        xhr.send(body);
      } else if (body != null) {
        if (!findHeaderKey(headers, "Content-Type")) {
          xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.send(JSON.stringify(body));
      } else {
        xhr.send();
      }
    });
  }
}
