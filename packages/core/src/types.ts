import type { RequestContext, ResponseContext } from "./context";
import type { ApiError } from "./error";
import type { Transport } from "./transport";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  transformRequest?:
    | ((data: any, headers?: Record<string, string>) => any | Promise<any>)
    | Array<
        (data: any, headers?: Record<string, string>) => any | Promise<any>
      >;
  transformResponse?:
    | ((data: any) => any | Promise<any>)
    | Array<(data: any) => any | Promise<any>>;
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
  params?: TParams;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  baseURL?: string;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  responseType?: "json" | "text" | "blob" | "arrayBuffer";
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
  validateResponse?: (data: TResponse) => boolean | Promise<boolean>;
  onValidationError?: (error: ApiError) => void;
  transformRequest?:
    | ((data: TBody, headers?: Record<string, string>) => any | Promise<any>)
    | Array<
        (data: any, headers?: Record<string, string>) => any | Promise<any>
      >;
  transformResponse?:
    | ((data: any) => TResponse | Promise<TResponse>)
    | Array<(data: any) => any | Promise<any>>;
  paramsSerializer?: ParamsSerializerConfig;
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
