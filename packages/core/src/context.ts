import type { HttpMethod, RequestOptions } from "./types";

export interface RequestTiming {
  /** Timestamp when request started (Date.now() or performance.now()) */
  startedAt: number;
  /** Timestamp when response was received */
  endedAt?: number;
  /** Duration in milliseconds */
  duration?: number;
}

export interface RequestContext<TBody = any, TParams = any> {
  /** HTTP method: GET, POST, PUT, DELETE, PATCH */
  method: HttpMethod;
  /** Original endpoint passed by caller (e.g. '/users') */
  endpoint: string;
  /** Base URL in effect */
  baseURL: string;
  /** Fully resolved URL including query parameters */
  url: string;
  /** Request body (parsed/structured or undefined) */
  body: TBody | undefined;
  /** Query parameters */
  params: TParams | undefined;
  /** Normalized request headers */
  headers: Record<string, string>;
  /** Timeout in milliseconds (0 = disabled) */
  timeout: number;
  /** Caller abort signal if provided */
  signal?: AbortSignal;
  /** Request credentials policy */
  credentials?: RequestCredentials;
  /** Expected response type */
  responseType: "json" | "text" | "blob" | "arrayBuffer";
  /** Current attempt count (1 for initial, 2+ for retries) */
  attempt: number;
  /** Arbitrary metadata bucket for user tracking, auth flags, etc. */
  metadata: Record<string, unknown>;
  /** Original raw request options */
  options: RequestOptions<any, any, any>;
}

export interface ResponseContext<TData = any> {
  /** Full request context that produced this response */
  request: RequestContext<any, any>;
  /** Native Fetch/XHR Response object */
  rawResponse: Response;
  /** Parsed and transformed response data */
  data: TData;
  /** HTTP status code (e.g. 200, 204, 404, 500) */
  status: number;
  /** HTTP status text (e.g. 'OK', 'Not Found') */
  statusText: string;
  /** Response headers as a plain key-value object */
  headers: Record<string, string>;
  /** Request timing metrics */
  timing: RequestTiming;
}
