import { createClient } from "@api-zero/core";
import { zodResponse } from "@api-zero/zod";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiProvider } from "../provider";
import { useRequest } from "../use-request";

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function createWrapper(baseURL = "https://api.test") {
  const client = createClient({ baseURL });
  return ({ children }: { children: React.ReactNode }) => (
    <ApiProvider client={client}>{children}</ApiProvider>
  );
}

describe("useRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch data on mount and update state to success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ id: 1, name: "Alice" })),
    );

    const wrapper = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useRequest<{ id: number; name: string }>("/users/1", { onSuccess }),
      { wrapper },
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.isIdle).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual({ id: 1, name: "Alice" });
    expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: "Alice" });
  });

  it("should handle request failure and populate error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { error: "Not Found" },
            { status: 404, statusText: "Not Found" },
          ),
        ),
    );

    const wrapper = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(() => useRequest("/users/999", { onError }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.status).toBe(404);
    expect(onError).toHaveBeenCalled();
  });

  it("should respect enabled: false and remain idle without fetching", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useRequest("/users", { enabled: false }),
      { wrapper },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should refetch data when refetch() is manually called", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        return jsonResponse({ count: callCount });
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useRequest<{ count: number }>("/counter"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.count).toBe(1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data?.count).toBe(2);
    expect(callCount).toBe(2);
  });

  it("should abort in-flight request when component unmounts", () => {
    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, init) => {
        capturedSignal = init?.signal;
        return new Promise(() => {}); // Never resolves
      }),
    );

    const wrapper = createWrapper();
    const { unmount } = renderHook(() => useRequest("/slow"), { wrapper });

    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("should seamlessly integrate with @api-zero/zod schemas and transforms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: 1,
          name: "Bob",
          createdAt: "2026-08-18T00:00:00.000Z",
        }),
      ),
    );

    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      createdAt: z.string().transform((d) => new Date(d)),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useRequest("/users/1", zodResponse(UserSchema)),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.name).toBe("Bob");
    expect(result.current.data?.createdAt).toBeInstanceOf(Date);
  });
});
