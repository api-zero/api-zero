import { ApiError } from './error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  debug?: boolean;
  logger?: LoggerConfig;
  transformRequest?: ((data: any) => any) | Array<(data: any) => any>;
  transformResponse?: ((data: any) => any) | Array<(data: any) => any>;
  paramsSerializer?: ParamsSerializerConfig;
}

export interface RequestOptions<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>> {
  params?: TParams;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  baseURL?: string;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
  validateResponse?: (data: TResponse) => boolean | Promise<boolean>;
  onValidationError?: (error: ApiError) => void;
  transformRequest?: ((data: TBody) => any) | Array<(data: any) => any>;
  transformResponse?: ((data: any) => TResponse) | Array<(data: any) => any>;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential' | ((attempt: number) => number);
  retryCondition?: (error: ApiError) => boolean;
}

export interface LoggerConfig {
  request?: (config: RequestOptions) => void;
  response?: (response: Response) => void;
  error?: (error: ApiError) => void;
}

export interface ParamsSerializerConfig {
  arrayFormat?: 'brackets' | 'repeat' | 'comma';
}


