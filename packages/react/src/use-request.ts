import type { ApiError, RequestOptions } from "@api-zero/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "./use-api";

export interface UseRequestOptions<
  TData = unknown,
  TParams = Record<string, unknown>,
> extends Omit<RequestOptions<TData, unknown, TParams>, "signal"> {
  /** Whether the request should automatically execute on mount and on parameter change (default: true) */
  enabled?: boolean;
  /** Initial data before the first successful fetch */
  initialData?: TData;
  /** Callback fired on successful response */
  onSuccess?: (data: TData) => void;
  /** Callback fired on error */
  onError?: (error: ApiError) => void;
}

export interface UseRequestResult<TData> {
  data: TData | undefined;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  refetch: () => Promise<TData | undefined>;
  abort: () => void;
}

export function useRequest<TData = unknown, TParams = Record<string, unknown>>(
  endpoint: string,
  options: UseRequestOptions<TData, TParams> = {},
): UseRequestResult<TData> {
  const api = useApi();
  const enabled = options.enabled ?? true;
  const initialData = options.initialData;

  const [data, setData] = useState<TData | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(enabled ? "loading" : "idle");

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(async (): Promise<TData | undefined> => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setStatus("loading");
    setError(null);

    try {
      const currentOpts = optionsRef.current;
      const responseData = await api.get<TData, TParams>(endpoint, {
        ...currentOpts,
        signal: controller.signal,
      });

      if (!mountedRef.current || controller.signal.aborted) {
        return undefined;
      }

      setData(responseData);
      setStatus("success");
      setLoading(false);
      optionsRef.current.onSuccess?.(responseData);
      return responseData;
    } catch (err: unknown) {
      if (!mountedRef.current || controller.signal.aborted) {
        return undefined;
      }

      const apiErr = err as ApiError;
      setError(apiErr);
      setStatus("error");
      setLoading(false);
      optionsRef.current.onError?.(apiErr);
      return undefined;
    }
  }, [api, endpoint]);

  // Serialized params dependency to trigger re-fetch when params change
  const _serializedParams = JSON.stringify(options.params);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      execute();
    } else {
      setStatus("idle");
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, enabled]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    data,
    loading,
    error,
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
    refetch: execute,
    abort,
  };
}
