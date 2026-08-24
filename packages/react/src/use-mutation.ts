import type { ApiError, HttpMethod, RequestOptions } from "@api-zero/core";
import { useCallback, useRef, useState } from "react";
import { useApi } from "./use-api";

export interface UseMutationOptions<
  TData = unknown,
  TBody = unknown,
  TParams = Record<string, unknown>,
> extends Omit<RequestOptions<TData, TBody, TParams>, "signal"> {
  /** Callback fired on successful mutation */
  onSuccess?: (data: TData, body?: TBody) => void;
  /** Callback fired on failed mutation */
  onError?: (error: ApiError, body?: TBody) => void;
  /** Callback fired after mutation finishes, regardless of success or failure */
  onSettled?: (data?: TData, error?: ApiError, body?: TBody) => void;
}

export interface UseMutationResult<
  TData = unknown,
  TBody = unknown,
  TParams = Record<string, unknown>,
> {
  data: TData | undefined;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  mutate: (
    body?: TBody,
    overrideOptions?: RequestOptions<TData, TBody, TParams>,
  ) => void;
  mutateAsync: (
    body?: TBody,
    overrideOptions?: RequestOptions<TData, TBody, TParams>,
  ) => Promise<TData>;
  reset: () => void;
}

export function useMutation<
  TData = unknown,
  TBody = unknown,
  TParams = Record<string, unknown>,
>(
  endpoint: string,
  method: HttpMethod = "POST",
  options: UseMutationOptions<TData, TBody, TParams> = {},
): UseMutationResult<TData, TBody, TParams> {
  const api = useApi();
  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutateAsync = useCallback(
    async (
      body?: TBody,
      overrideOptions?: RequestOptions<TData, TBody, TParams>,
    ): Promise<TData> => {
      setLoading(true);
      setStatus("loading");
      setError(null);

      try {
        const currentOpts = optionsRef.current;
        const responseData = await api.request<TData, TBody, TParams>(
          endpoint,
          method,
          body,
          {
            ...currentOpts,
            ...overrideOptions,
          },
        );

        setData(responseData);
        setStatus("success");
        setLoading(false);
        optionsRef.current.onSuccess?.(responseData, body);
        optionsRef.current.onSettled?.(responseData, undefined, body);
        return responseData;
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        setError(apiErr);
        setStatus("error");
        setLoading(false);
        optionsRef.current.onError?.(apiErr, body);
        optionsRef.current.onSettled?.(undefined, apiErr, body);
        throw apiErr;
      }
    },
    [api, endpoint, method],
  );

  const mutate = useCallback(
    (body?: TBody, overrideOptions?: RequestOptions<TData, TBody, TParams>) => {
      mutateAsync(body, overrideOptions).catch(() => {
        // Error state and onError callback are handled inside mutateAsync
      });
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
    setStatus("idle");
  }, []);

  return {
    data,
    loading,
    error,
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
    mutate,
    mutateAsync,
    reset,
  };
}
