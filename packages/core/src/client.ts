import { ApiError } from './error';
import { InterceptorManager } from './interceptors';
import { serializeParams } from './params';
import { withRetry } from './retry';
import { ApiClientConfig, RequestOptions, HttpMethod } from './types';

export class ApiClient {
  public interceptors = {
    request: new InterceptorManager<RequestOptions>(),
    response: new InterceptorManager<Response>(),
  };

  constructor(private config: ApiClientConfig = {}) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  setConfig(config: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig() {
    return this.config;
  }

  setAuthToken(token: string) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  setBasicAuth(username: string, password: string) {
    const token = btoa(`${username}:${password}`);
    this.setHeader('Authorization', `Basic ${token}`);
  }

  clearAuth() {
    this.removeHeader('Authorization');
  }

  setHeader(key: string, value: string) {
    this.config.headers = { ...this.config.headers, [key]: value };
  }

  removeHeader(key: string) {
    if (this.config.headers) {
      delete this.config.headers[key];
    }
  }

  updateHeaders(headers: Record<string, string>) {
    this.config.headers = { ...this.config.headers, ...headers };
  }

  async request<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    method: HttpMethod,
    body?: TBody,
    options: RequestOptions<TResponse, TBody, TParams> = {}
  ): Promise<TResponse> {
    let config: RequestOptions<TResponse, TBody, TParams> = {
      ...this.config,
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
    };

    // Transform request
    if (this.config.transformRequest) {
        const transforms = Array.isArray(this.config.transformRequest) 
            ? this.config.transformRequest 
            : [this.config.transformRequest];
            
        transforms.forEach(fn => {
            body = fn(body) as TBody;
        });
    }

    // Run request interceptors
    try {
      let promise = Promise.resolve(config as RequestOptions);
      this.interceptors.request.forEach(({ fulfilled, rejected }) => {
        promise = promise.then(fulfilled, rejected);
      });
      config = (await promise) as RequestOptions<TResponse, TBody, TParams>;
    } catch (error: unknown) {
      return Promise.reject(error);
    }

    const baseURL = config.baseURL || '';
    let url = endpoint;
    if (baseURL) {
        const cleanBaseURL = baseURL.replace(/\/+$/, '');
        const cleanEndpoint = endpoint.replace(/^\/+/, '');
        url = cleanEndpoint ? `${cleanBaseURL}/${cleanEndpoint}` : cleanBaseURL;
    }
    
    if (config.params) {
      const queryString = serializeParams(config.params, this.config.paramsSerializer);
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return withRetry(() => this.performRequest<TResponse, TBody, TParams>(url, method, body, config), config.retry);
  }

  private async performRequest<TResponse, TBody, TParams>(
    url: string,
    method: HttpMethod,
    body: TBody | undefined,
    config: RequestOptions<TResponse, TBody, TParams>
  ): Promise<TResponse> {
    if (config.onUploadProgress) {
        return this.xhrRequest<TResponse, TBody, TParams>(url, method, body, config);
    }

    const headers: Record<string, string> = { ...config.headers };

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: config.credentials,
      signal: config.signal,
    };

    if (body) {
      if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer) {
        fetchOptions.body = body;
        if (body instanceof FormData) {
           delete headers['Content-Type'];
        }
      } else {
        fetchOptions.body = JSON.stringify(body);
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
      }
    }

    const timeout = config.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    if (config.signal) {
        config.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
        });
    }

    fetchOptions.signal = controller.signal;

    try {
      let response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Run response interceptors
      let promise = Promise.resolve(response);
      this.interceptors.response.forEach(({ fulfilled, rejected }) => {
        promise = promise.then(fulfilled, rejected);
      });
      response = await promise;

      if (!response.ok) {
        let data: unknown;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }
        throw new ApiError(
            response.statusText || 'Error on request',
            response.status,
            response.statusText,
            data,
            config as any
        );
      }

      const responseType = config.responseType || 'json';
      let data: unknown;
      if (responseType === 'json') {
        data = await response.json();
      } else if (responseType === 'text') {
        data = await response.text();
      } else if (responseType === 'blob') {
        data = await response.blob();
      } else if (responseType === 'arrayBuffer') {
        data = await response.arrayBuffer();
      }

      // Transform response
      if (this.config.transformResponse) {
        const transforms = Array.isArray(this.config.transformResponse)
            ? this.config.transformResponse
            : [this.config.transformResponse];
            
        transforms.forEach(fn => {
            data = fn(data);
        });
      }

      // Validate response
      if (config.validateResponse) {
          try {
              const isValid = await config.validateResponse(data as TResponse);
              if (!isValid) {
                  throw new Error('Response validation failed');
              }
          } catch (error: unknown) {
              if (config.onValidationError && error instanceof ApiError) {
                  config.onValidationError(error);
              } else if (config.onValidationError) {
                   // Wrap unknown error in ApiError for consistency
                   const wrappedError = new ApiError(
                       error instanceof Error ? error.message : 'Validation Error',
                       0,
                       'Validation Error',
                       data,
                       config as any
                   );
                   config.onValidationError(wrappedError);
              }
              throw error;
          }
      }

      return data as TResponse;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      if (isAbortError) {
         if (config.signal?.aborted) {
             throw new ApiError('Request aborted', 0, 'Aborted', undefined, config as any, false, false, true);
         } else {
             throw new ApiError('Request timeout', 408, 'Timeout', undefined, config as any, true, false, false);
         }
      }
      
      const message = error instanceof Error ? error.message : 'Network Error';
      throw new ApiError(message, 0, 'Network Error', undefined, config as any, false, true, false);
    }
  }

  private xhrRequest<TResponse, TBody, TParams>(
    url: string,
    method: HttpMethod,
    body: TBody | undefined,
    config: RequestOptions<TResponse, TBody, TParams>
  ): Promise<TResponse> {
      return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, url);
          
          if (config.headers) {
              Object.entries(config.headers).forEach(([key, value]) => {
                  if (key.toLowerCase() === 'content-type' && body instanceof FormData) return;
                  xhr.setRequestHeader(key, value);
              });
          }

          if (config.credentials === 'include') {
              xhr.withCredentials = true;
          }

          if (config.timeout) {
              xhr.timeout = config.timeout;
          }

          if (config.onUploadProgress) {
              xhr.upload.onprogress = config.onUploadProgress;
          }

          if (config.onDownloadProgress) {
              xhr.onprogress = config.onDownloadProgress;
          }

          xhr.onload = async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                  let data: unknown;
                  const responseType = config.responseType || 'json';
                  if (responseType === 'json') {
                      try {
                          data = JSON.parse(xhr.responseText);
                      } catch {
                          data = xhr.responseText;
                      }
                  } else {
                      data = xhr.response;
                  }
                                     // Transform response
                    if (this.config.transformResponse) {
                        const transforms = Array.isArray(this.config.transformResponse)
                            ? this.config.transformResponse
                            : [this.config.transformResponse];

                        transforms.forEach(fn => {
                            data = fn(data);
                        });
                    }

                    // Validate response (XHR)
                    if (config.validateResponse) {
                        try {
                            // Note: validateResponse might be async, but XHR onload is sync context mostly.
                            // We'll treat it as promise-based for consistency.
                            Promise.resolve(config.validateResponse(data as TResponse))
                                .then(isValid => {
                                    if (!isValid) throw new Error('Response validation failed');
                                    resolve(data as TResponse);
                                })
                                .catch(error => {
                                    if (config.onValidationError) {
                                         const wrappedError = new ApiError(
                                             error instanceof Error ? error.message : 'Validation Error',
                                             0,
                                             'Validation Error',
                                             data,
                                             config as any
                                         );
                                         config.onValidationError(wrappedError);
                                    }
                                    reject(error);
                                });
                            return;
                        } catch (error) {
                             reject(error);
                             return;
                        }
                    }

                  resolve(data as TResponse);
              } else {
                  let data: unknown;
                  try {
                      data = JSON.parse(xhr.responseText);
                  } catch {
                      data = xhr.responseText;
                  }
                  reject(new ApiError(
                      xhr.statusText || 'Error on request',
                      xhr.status,
                      xhr.statusText,
                      data,
                      config as any
                  ));
              }
          };

          xhr.onerror = () => {
              reject(new ApiError('Network Error', 0, 'Network Error', undefined, config as any, false, true, false));
          };

          xhr.ontimeout = () => {
              reject(new ApiError('Request timeout', 408, 'Timeout', undefined, config as any, true, false, false));
          };

          xhr.onabort = () => {
              reject(new ApiError('Request aborted', 0, 'Aborted', undefined, config as any, false, false, true));
          };

          if (config.signal) {
              config.signal.addEventListener('abort', () => {
                  xhr.abort();
              });
          }

          if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer) {
              xhr.send(body);
          } else if (body) {
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.send(JSON.stringify(body));
          } else {
              xhr.send();
          }
      });
  }

  get<TResponse = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions<TResponse, unknown, TParams>
  ) {
    return this.request<TResponse, unknown, TParams>(endpoint, 'GET', undefined, options);
  }

  post<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>
  ) {
    return this.request<TResponse, TBody, TParams>(endpoint, 'POST', body, options);
  }

  put<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>
  ) {
    return this.request<TResponse, TBody, TParams>(endpoint, 'PUT', body, options);
  }

  patch<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>
  ) {
    return this.request<TResponse, TBody, TParams>(endpoint, 'PATCH', body, options);
  }

  delete<TResponse = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions<TResponse, unknown, TParams>
  ) {
    return this.request<TResponse, unknown, TParams>(endpoint, 'DELETE', undefined, options);
  }
}

export function createClient(config?: ApiClientConfig) {
  return new ApiClient(config);
}
