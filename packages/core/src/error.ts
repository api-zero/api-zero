import type { RequestContext } from "./context";
import type { RequestOptions } from "./types";

export interface ApiErrorOptions<TData = unknown> {
  status?: number;
  statusText?: string;
  data?: TData;
  request?: RequestContext;
  response?: Response;
  cause?: Error;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isAborted?: boolean;
  isValidationError?: boolean;
  attempt?: number;
}

export class ApiError<TData = unknown> extends Error {
  public override readonly name: string = "ApiError";
  /** HTTP status, or `0` when no response arrived. */
  public readonly status: number;
  /** HTTP status text. */
  public readonly statusText: string;
  /** Parsed error body, when the server sent one. */
  public readonly data?: TData;
  /** The request that failed: method, resolved URL, headers, params, attempt. */
  public readonly request?: RequestContext;
  /** The native response, when there was one. */
  public readonly response?: Response;
  /** The original error, preserved. */
  public override readonly cause?: Error;
  /** The request exceeded its timeout. Distinct from `isAborted`. */
  public readonly isTimeout: boolean;
  /** The request never produced a response: DNS, connectivity, refused. */
  public readonly isNetworkError: boolean;
  /** Cancelled through the caller's `AbortSignal`, not by a timeout. */
  public readonly isAborted: boolean;
  /** The response arrived but failed validation. Never retried. */
  public readonly isValidationError: boolean;
  /** Which attempt produced this failure. `1` when retries are off. */
  public readonly attempt: number;

  constructor(
    message: string,
    status = 0,
    statusText = "",
    data?: TData,
    requestOrConfig?: RequestContext | RequestOptions,
    isTimeout = false,
    isNetworkError = false,
    isAborted = false,
    isValidationError = false,
    response?: Response,
    cause?: Error,
    attempt = 1,
  ) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.request = requestOrConfig as RequestContext | undefined;
    this.response = response;
    this.cause = cause;
    this.isTimeout = isTimeout;
    this.isNetworkError = isNetworkError;
    this.isAborted = isAborted;
    this.isValidationError = isValidationError;
    this.attempt = attempt;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Factory method to create an ApiError using an options bag.
   */
  static from<T = unknown>(
    message: string,
    options: ApiErrorOptions<T> = {},
  ): ApiError<T> {
    return new ApiError<T>(
      message,
      options.status ?? 0,
      options.statusText ?? "",
      options.data,
      options.request,
      options.isTimeout ?? false,
      options.isNetworkError ?? false,
      options.isAborted ?? false,
      options.isValidationError ?? false,
      options.response,
      options.cause,
      options.attempt ?? 1,
    );
  }

  /**
   * Backward compatibility alias: `error.config` maps to `error.request`.
   */
  get config(): RequestContext | undefined {
    return this.request;
  }

  is4xx(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  is5xx(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidation(): boolean {
    return this.isValidationError;
  }

  isRetryable(): boolean {
    if (this.isAborted || this.isValidationError) {
      return false;
    }
    if (this.isNetworkError || this.isTimeout) {
      return true;
    }
    if (this.status === 408 || this.status === 429) {
      return true;
    }
    return this.status >= 500 && this.status < 600;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      data: this.data,
      isTimeout: this.isTimeout,
      isNetworkError: this.isNetworkError,
      isAborted: this.isAborted,
      isValidationError: this.isValidationError,
      attempt: this.attempt,
      url: this.request?.url,
      method: this.request?.method,
    };
  }
}
