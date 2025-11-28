import { RequestOptions } from './types';

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown,
    public readonly config?: RequestOptions,
    public readonly isTimeout = false,
    public readonly isNetworkError = false,
    public readonly isAborted = false,
  ) {
    super(message);
  }

  is4xx() { return this.status >= 400 && this.status < 500; }
  is5xx() { return this.status >= 500; }
  isUnauthorized() { return this.status === 401; }
  isForbidden() { return this.status === 403; }
  isNotFound() { return this.status === 404; }

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
    };
  }
}
