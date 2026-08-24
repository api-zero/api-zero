import { createClient } from "@api-zero/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiProvider } from "../provider";
import { useMutation } from "../use-mutation";

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

describe("useMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with idle state", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMutation("/users"), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should execute mutation with mutateAsync and trigger lifecycle callbacks", async () => {
    const mockResponseData = { id: 10, name: "Alice", role: "admin" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(mockResponseData)),
    );

    const onSuccess = vi.fn();
    const onSettled = vi.fn();
    const wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useMutation<
          { id: number; name: string; role: string },
          { name: string; role: string }
        >("/users", "POST", { onSuccess, onSettled }),
      { wrapper },
    );

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.mutateAsync({
        name: "Alice",
        role: "admin",
      });
    });

    expect(returnedData).toEqual(mockResponseData);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockResponseData);

    expect(onSuccess).toHaveBeenCalledWith(mockResponseData, {
      name: "Alice",
      role: "admin",
    });
    expect(onSettled).toHaveBeenCalledWith(mockResponseData, undefined, {
      name: "Alice",
      role: "admin",
    });
  });

  it("should handle mutation failure and invoke onError callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { error: "Unauthorized" },
            { status: 401, statusText: "Unauthorized" },
          ),
        ),
    );

    const onError = vi.fn();
    const onSettled = vi.fn();
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useMutation("/protected", "POST", { onError, onSettled }),
      { wrapper },
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({ token: "invalid" }),
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error?.status).toBe(401);

    expect(onError).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith(undefined, expect.anything(), {
      token: "invalid",
    });
  });

  it("should support mutate fire-and-forget execution", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ deleted: true })),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useMutation<{ deleted: boolean }>("/users/1", "DELETE"),
      { wrapper },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ deleted: true });
  });

  it("should reset state to idle when reset() is called", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ id: 1 })));

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useMutation<{ id: number }>("/items", "POST"),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ name: "item1" });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual({ id: 1 });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
