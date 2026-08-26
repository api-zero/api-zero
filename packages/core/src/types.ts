import type { RequestContext, ResponseContext } from "./context";
import type { ApiError } from "./error";
import type { Transport } from "./transport";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiClientConfig {
  /** Prefix for every endpoint. Requests pass a path, not a full URL. */
  baseURL?: string;
  /** Milliseconds before a request is aborted. `0` disables the timeout. */
  timeout?: number;
  /** Sent with every request. Names are matched case-insensitively. */
  headers?: Record<string, string>;
  /** Standard Fetch credentials mode. */
  credentials?: RequestCredentials;
  /**
   * Retry policy. Off by default: a client that silently repeats
   * requests can charge a customer twice.
   */
  retry?: RetryConfig | false;
  /** Runs on the body before request interceptors. May be async. */
  transformRequest?:
    | ((data: any, headers?: Record<string, string>) => any | Promise<any>)
    | Array<
        (data: any, headers?: Record<string, string>) => any | Promise<any>
      >;
  /** Runs on the parsed body before validation. May be async. */
  transformResponse?:
    | ((data: any) => any | Promise<any>)
    | Array<(data: any) => any | Promise<any>>;
  /** How arrays become a query string: brackets, repeat or comma. */
  paramsSerializer?: ParamsSerializerConfig;
  /**
   * Optional custom or mocked transport adapter.
   * If not provided, FetchTransport or XhrTransport (for progress) is used automatically.
   */
  transport?: Transport;
}

export interface RequestOptions<
  TResponse = unknown,
  TBody = unknown,
  TParams = Record<string, unknown>,
> {
  /** Query parameters. `null` and `undefined` entries are dropped. */
  params?: TParams;
  /** Merged over the client's headers for this request only. */
  headers?: Record<string, string>;
  /** Milliseconds. `0` disables the timeout for this request. */
  timeout?: number;
  /** Caller cancellation. Composed with the timeout into one signal. */
  signal?: AbortSignal;
  /** Override the base URL for a single call. */
  baseURL?: string;
  /** Standard Fetch credentials mode. */
  credentials?: RequestCredentials;
  /** Override the retry policy, or `false` to opt this call out. */
  retry?: RetryConfig | false;
  /** How to read the body. Binary payloads need `blob` or `arrayBuffer`. */
  responseType?: "json" | "text" | "blob" | "arrayBuffer";
  /** Browser only. Switches the request to `XhrTransport`. */
  onUploadProgress?: (progress: ProgressEvent) => void;
  /** Browser only. Switches the request to `XhrTransport`. */
  onDownloadProgress?: (progress: ProgressEvent) => void;
  /** Reject a structurally valid but unacceptable body. */
  validateResponse?: (data: TResponse) => boolean | Promise<boolean>;
  /** Called when validation rejects, before the error is thrown. */
  onValidationError?: (error: ApiError) => void;
  /** Runs after the client's own request transforms. */
  transformRequest?:
    | ((data: TBody, headers?: Record<string, string>) => any | Promise<any>)
    | Array<
        (data: any, headers?: Record<string, string>) => any | Promise<any>
      >;
  /** Runs after the client's own response transforms. */
  transformResponse?:
    | ((data: any) => TResponse | Promise<TResponse>)
    | Array<(data: any) => any | Promise<any>>;
  /** Array encoding for this request. */
  paramsSerializer?: ParamsSerializerConfig;
  /**
   * Your own bucket. Nothing in the library reads it, and it travels
   * with the request context — which is how an interceptor tags a
   * replayed request.
   */
  metadata?: Record<string, unknown>;
}

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3 if enabled) */
  attempts: number;
  /** Initial base delay in milliseconds (default: 1000) */
  delay: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff algorithm: 'exponential' (default), 'linear', or custom function */
  backoff?:
    | "linear"
    | "exponential"
    | ((attempt: number, error: ApiError) => number);
  /** Add randomness to delay to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Respect Retry-After header from 429/503 responses (default: true) */
  respectRetryAfter?: boolean;
  /** HTTP methods allowed to be automatically retried (default: ['GET', 'PUT', 'DELETE']) */
  retryMethods?: HttpMethod[];
  /** Allow retrying non-idempotent unsafe methods like POST and PATCH (default: false) */
  retryUnsafeMethods?: boolean;
  /** Custom filter to determine if an error should trigger a retry */
  retryCondition?: (error: ApiError, attempt: number) => boolean;
  /** Callback fired before each retry attempt */
  onRetry?: (event: RetryEvent) => void;
}

export interface RetryEvent {
  attempt: number;
  maxAttempts: number;
  error: ApiError;
  delay: number;
  request?: RequestContext;
}

export interface ParamsSerializerConfig {
  arrayFormat?: "brackets" | "repeat" | "comma";
}

export type RequestInterceptor = (
  context: RequestContext,
) => RequestContext | Promise<RequestContext> | void | Promise<void>;

export type RequestErrorInterceptor = (error: unknown) => any;

export type ResponseInterceptor<T = any> = (
  response: ResponseContext<T>,
) =>
  | ResponseContext<T>
  | Promise<ResponseContext<T>>
  | T
  | Promise<T>
  | void
  | Promise<void>;

export type ResponseErrorInterceptor = (error: ApiError) => any;
