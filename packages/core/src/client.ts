import type { RequestContext, RequestTiming, ResponseContext } from "./context";
import { ApiError } from "./error";
import { InterceptorManager } from "./interceptors";
import { serializeParams } from "./params";
import { withRetry } from "./retry";
import {
  FetchTransport,
  findHeaderKey,
  type Transport,
  toBase64,
  XhrTransport,
} from "./transport";
import type { ApiClientConfig, HttpMethod, RequestOptions } from "./types";

/**
 * Type guard to check if an object is a ResponseContext.
 */
function isResponseContext(value: unknown): value is ResponseContext {
  return (
    value !== null &&
    typeof value === "object" &&
    "rawResponse" in value &&
    "data" in value &&
    "status" in value
  );
}

export class ApiClient {
  public interceptors = {
    request: new InterceptorManager<RequestContext, unknown>(),
    response: new InterceptorManager<ResponseContext<any>, ApiError>(),
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

  getConfig(): ApiClientConfig {
    return this.config;
  }

  setAuthToken(token: string) {
    this.setHeader("Authorization", `Bearer ${token}`);
  }

  setBasicAuth(username: string, password: string) {
    const token = toBase64(`${username}:${password}`);
    this.setHeader("Authorization", `Basic ${token}`);
  }

  clearAuth() {
    this.removeHeader("Authorization");
  }

  setHeader(key: string, value: string) {
    this.config.headers = { ...this.config.headers, [key]: value };
  }

  removeHeader(key: string) {
    if (this.config.headers) {
      const existingKey = findHeaderKey(this.config.headers, key) ?? key;
      delete this.config.headers[existingKey];
    }
  }

  updateHeaders(headers: Record<string, string>) {
    this.config.headers = { ...this.config.headers, ...headers };
  }

  async request<
    TResponse = unknown,
    TBody = unknown,
    TParams = Record<string, unknown>,
  >(
    endpoint: string,
    method: HttpMethod,
    body?: TBody,
    options: RequestOptions<TResponse, TBody, TParams> = {},
  ): Promise<TResponse> {
    // 1. Resolve URL
    const baseURL = options.baseURL ?? this.config.baseURL ?? "";
    let url = endpoint;
    if (baseURL) {
      const cleanBaseURL = baseURL.replace(/\/+$/, "");
      const cleanEndpoint = endpoint.replace(/^\/+/, "");
      url = cleanEndpoint ? `${cleanBaseURL}/${cleanEndpoint}` : cleanBaseURL;
    }

    // 2. Serialize query parameters (options override config)
    const effectiveParamsSerializer =
      options.paramsSerializer ?? this.config.paramsSerializer;
    if (options.params) {
      const queryString = serializeParams(
        options.params as Record<string, unknown>,
        effectiveParamsSerializer,
      );
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    // 3. Merge headers
    const mergedHeaders: Record<string, string> = {
      ...this.config.headers,
      ...options.headers,
    };

    // 4. Compose transformRequest: Global first, then Per-Request
    let transformedBody: any = body;
    if (this.config.transformRequest) {
      const globalTransforms = Array.isArray(this.config.transformRequest)
        ? this.config.transformRequest
        : [this.config.transformRequest];
      for (const fn of globalTransforms) {
        transformedBody = await fn(transformedBody, mergedHeaders);
      }
    }
    if (options.transformRequest) {
      const reqTransforms = Array.isArray(options.transformRequest)
        ? options.transformRequest
        : [options.transformRequest];
      for (const fn of reqTransforms) {
        transformedBody = await fn(transformedBody, mergedHeaders);
      }
    }

    // 5. Build initial RequestContext
    let requestContext: RequestContext<TBody, TParams> = {
      method,
      endpoint,
      baseURL,
      url,
      body: transformedBody as TBody,
      params: options.params,
      headers: mergedHeaders,
      timeout: options.timeout ?? this.config.timeout ?? 30000,
      signal: options.signal,
      credentials: options.credentials ?? this.config.credentials,
      responseType: options.responseType ?? "json",
      attempt: 1,
      metadata: { ...options.metadata },
      options,
    };

    // 6. Run Request Interceptors
    try {
      for (const handler of this.interceptors.request.activeHandlers) {
        if (handler.fulfilled) {
          const result = await handler.fulfilled(requestContext);
          if (result !== undefined && result !== null) {
            requestContext = result;
          }
        }
      }
    } catch (error: unknown) {
      return Promise.reject(error);
    }

    // 7. Execute transport with retry & response interceptors
    const effectiveRetry =
      options.retry !== undefined ? options.retry : this.config.retry;

    return withRetry(
      async (attempt = 1) => {
        requestContext.attempt = attempt;
        return this.executePipeline<TResponse, TBody, TParams>(
          requestContext,
          options,
        );
      },
      effectiveRetry,
      requestContext,
    );
  }

  /**
   * Resolve the transport instance to use for this request.
   */
  private resolveTransport(context: RequestContext): Transport {
    if (this.config.transport) {
      return this.config.transport;
    }
    if (
      context.options.onUploadProgress ||
      context.options.onDownloadProgress
    ) {
      return new XhrTransport();
    }
    return new FetchTransport();
  }

  private async executePipeline<TResponse, TBody, TParams>(
    requestContext: RequestContext<TBody, TParams>,
    options: RequestOptions<TResponse, TBody, TParams>,
  ): Promise<TResponse> {
    const startedAt = Date.now();
    let rawResponse: Response | undefined;

    try {
      // 1. Perform Transport Request
      const transport = this.resolveTransport(requestContext);
      const transportResult = await transport.send(requestContext);

      rawResponse = transportResult.rawResponse;
      let data = transportResult.data;
      const responseHeaders = transportResult.headers;
      const status = transportResult.status;
      const statusText = transportResult.statusText;

      // 2. Compose transformResponse: Global first, then Per-Request
      if (this.config.transformResponse) {
        const globalTransforms = Array.isArray(this.config.transformResponse)
          ? this.config.transformResponse
          : [this.config.transformResponse];
        for (const fn of globalTransforms) {
          data = await fn(data);
        }
      }
      if (options.transformResponse) {
        const reqTransforms = Array.isArray(options.transformResponse)
          ? options.transformResponse
          : [options.transformResponse];
        for (const fn of reqTransforms) {
          data = await fn(data);
        }
      }

      // 3. Validate Response
      if (options.validateResponse) {
        try {
          const isValid = await options.validateResponse(data as TResponse);
          if (!isValid) {
            throw new Error("Response validation failed");
          }
        } catch (validationErr: unknown) {
          const valError =
            validationErr instanceof ApiError
              ? validationErr
              : ApiError.from(
                  validationErr instanceof Error
                    ? validationErr.message
                    : "Response validation failed",
                  {
                    status,
                    statusText,
                    data,
                    request: requestContext,
                    response: rawResponse,
                    cause:
                      validationErr instanceof Error
                        ? validationErr
                        : undefined,
                    isValidationError: true,
                    attempt: requestContext.attempt,
                  },
                );

          if (options.onValidationError) {
            options.onValidationError(valError);
          }
          throw valError;
        }
      }

      const endedAt = Date.now();
      const timing: RequestTiming = {
        startedAt,
        endedAt,
        duration: endedAt - startedAt,
      };

      // 4. Build ResponseContext
      let responseContext: ResponseContext<TResponse> = {
        request: requestContext,
        rawResponse: rawResponse ?? new Response(),
        data: data as TResponse,
        status,
        statusText,
        headers: responseHeaders,
        timing,
      };

      // 5. Run Response Success Interceptors
      for (const handler of this.interceptors.response.activeHandlers) {
        if (handler.fulfilled) {
          const result = await handler.fulfilled(responseContext);
          if (result !== undefined && result !== null) {
            if (isResponseContext(result)) {
              responseContext = result as ResponseContext<TResponse>;
            } else {
              responseContext.data = result as TResponse;
            }
          }
        }
      }

      return responseContext.data;
    } catch (error: unknown) {
      const endedAt = Date.now();
      const apiError = this.normalizeError(
        error,
        requestContext,
        rawResponse,
        startedAt,
        endedAt,
      );

      // Run Response Error Interceptors (rejection chain)
      for (const handler of this.interceptors.response.activeHandlers) {
        if (handler.rejected) {
          try {
            const recovered = await handler.rejected(apiError);
            if (recovered !== undefined) {
              return recovered;
            }
          } catch (nextError: unknown) {
            throw this.normalizeError(
              nextError,
              requestContext,
              rawResponse,
              startedAt,
              endedAt,
            );
          }
        }
      }

      throw apiError;
    }
  }

  private normalizeError(
    error: unknown,
    context: RequestContext,
    response?: Response,
    _startedAt?: number,
    _endedAt?: number,
  ): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const isAbortError = error instanceof Error && error.name === "AbortError";

    if (isAbortError) {
      if (context.signal?.aborted) {
        return ApiError.from("Request aborted", {
          status: 0,
          statusText: "Aborted",
          request: context,
          response,
          cause: error instanceof Error ? error : undefined,
          isAborted: true,
          attempt: context.attempt,
        });
      }
      return ApiError.from("Request timeout", {
        status: 408,
        statusText: "Timeout",
        request: context,
        response,
        cause: error instanceof Error ? error : undefined,
        isTimeout: true,
        attempt: context.attempt,
      });
    }

    const message = error instanceof Error ? error.message : "Network Error";
    return ApiError.from(message, {
      status: 0,
      statusText: "Network Error",
      request: context,
      response,
      cause: error instanceof Error ? error : undefined,
      isNetworkError: true,
      attempt: context.attempt,
    });
  }

  get<TResponse = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions<TResponse, unknown, TParams>,
  ) {
    return this.request<TResponse, unknown, TParams>(
      endpoint,
      "GET",
      undefined,
      options,
    );
  }

  post<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>,
  ) {
    return this.request<TResponse, TBody, TParams>(
      endpoint,
      "POST",
      body,
      options,
    );
  }

  put<TResponse = unknown, TBody = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>,
  ) {
    return this.request<TResponse, TBody, TParams>(
      endpoint,
      "PUT",
      body,
      options,
    );
  }

  patch<
    TResponse = unknown,
    TBody = unknown,
    TParams = Record<string, unknown>,
  >(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions<TResponse, TBody, TParams>,
  ) {
    return this.request<TResponse, TBody, TParams>(
      endpoint,
      "PATCH",
      body,
      options,
    );
  }

  delete<TResponse = unknown, TParams = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions<TResponse, unknown, TParams>,
  ) {
    return this.request<TResponse, unknown, TParams>(
      endpoint,
      "DELETE",
      undefined,
      options,
    );
  }
}

export function createClient(config?: ApiClientConfig) {
  return new ApiClient(config);
}
