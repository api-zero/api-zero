import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../client";
import { ApiError } from "../error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const spy = vi.fn(handler);
  vi.stubGlobal("fetch", spy);
  return spy;
}

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

// ---------------------------------------------------------------------------
// Lifecycle Contract Tests
// ---------------------------------------------------------------------------

describe("Lifecycle Contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Pipeline Execution Order
  // =========================================================================
  describe("Execution Order", () => {
    it("should execute transforms, interceptors, and validation in strict deterministic order", async () => {
      const order: string[] = [];

      mockFetch((_url) => {
        order.push("fetch");
        return jsonResponse({ value: 10 });
      });

      const client = createClient({
        baseURL: "https://api.test",
        transformRequest: (data) => {
          order.push("globalTransformRequest");
          return { ...data, global: true };
        },
        transformResponse: (data: any) => {
          order.push("globalTransformResponse");
          return { ...data, globalRes: true };
        },
      });

      client.interceptors.request.use((ctx) => {
        order.push("requestInterceptor1");
        ctx.headers["X-Test-1"] = "1";
      });

      client.interceptors.request.use(async (ctx) => {
        order.push("requestInterceptor2");
        await Promise.resolve();
        ctx.headers["X-Test-2"] = "2";
      });

      client.interceptors.response.use((res) => {
        order.push("responseInterceptor1");
        return res;
      });

      client.interceptors.response.use(async (res) => {
        order.push("responseInterceptor2");
        await Promise.resolve();
        return res;
      });

      const result = await client.post<any>(
        "/test",
        { initial: true },
        {
          transformRequest: (data) => {
            order.push("requestTransformRequest");
            return { ...data, perRequest: true };
          },
          transformResponse: (data: any) => {
            order.push("requestTransformResponse");
            return { ...data, perReqRes: true };
          },
          validateResponse: (_data) => {
            order.push("validateResponse");
            return true;
          },
        },
      );

      expect(order).toEqual([
        "globalTransformRequest",
        "requestTransformRequest",
        "requestInterceptor1",
        "requestInterceptor2",
        "fetch",
        "globalTransformResponse",
        "requestTransformResponse",
        "validateResponse",
        "responseInterceptor1",
        "responseInterceptor2",
      ]);

      expect(result).toEqual({
        value: 10,
        globalRes: true,
        perReqRes: true,
      });
    });
  });

  // =========================================================================
  // 2. Request Interceptors Contract
  // =========================================================================
  describe("Request Interceptors", () => {
    it("should provide full RequestContext with method, resolved URL, headers, and metadata", async () => {
      let interceptedContext: any = null;

      mockFetch((_url, _init) => {
        return jsonResponse({ ok: true });
      });

      const client = createClient({ baseURL: "https://api.test/v1" });

      client.interceptors.request.use((ctx) => {
        interceptedContext = ctx;
        ctx.headers.Authorization = "Bearer token-123";
        ctx.metadata.userId = "user-456";
      });

      await client.post(
        "/users",
        { name: "Alice" },
        { params: { active: true }, metadata: { source: "test" } },
      );

      expect(interceptedContext).not.toBeNull();
      expect(interceptedContext.method).toBe("POST");
      expect(interceptedContext.endpoint).toBe("/users");
      expect(interceptedContext.baseURL).toBe("https://api.test/v1");
      expect(interceptedContext.url).toBe(
        "https://api.test/v1/users?active=true",
      );
      expect(interceptedContext.body).toEqual({ name: "Alice" });
      expect(interceptedContext.headers.Authorization).toBe("Bearer token-123");
      expect(interceptedContext.metadata).toEqual({
        source: "test",
        userId: "user-456",
      });
      expect(interceptedContext.attempt).toBe(1);
    });

    it("should support returning a replacement RequestContext", async () => {
      const fetchSpy = mockFetch((_url, _init) => {
        return jsonResponse({ ok: true });
      });

      const client = createClient({ baseURL: "https://api.test" });

      client.interceptors.request.use((ctx) => {
        // Return a modified clone
        return {
          ...ctx,
          url: "https://api.test/redirected",
          headers: { ...ctx.headers, "X-Redirected": "true" },
        };
      });

      await client.get("/original");

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.test/redirected");
      expect((init?.headers as Record<string, string>)["X-Redirected"]).toBe(
        "true",
      );
    });

    it("should short-circuit and reject if a request interceptor throws", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({ baseURL: "https://api.test" });

      client.interceptors.request.use(() => {
        throw new Error("Interceptor blocked request");
      });

      await expect(client.get("/data")).rejects.toThrow(
        "Interceptor blocked request",
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Response Interceptors Contract
  // =========================================================================
  describe("Response Interceptors", () => {
    it("should provide ResponseContext with parsed data, status, headers, timing, and request", async () => {
      let interceptedResponse: any = null;

      mockFetch(() => {
        return jsonResponse(
          { id: 1, name: "Item" },
          { headers: { "X-Custom-Server-Header": "served" } },
        );
      });

      const client = createClient({ baseURL: "https://api.test" });

      client.interceptors.response.use((res) => {
        interceptedResponse = res;
        // Transform data by adding a formatted field
        res.data.formatted = true;
        return res;
      });

      const data = await client.get<any>("/item/1");

      expect(interceptedResponse).not.toBeNull();
      expect(interceptedResponse.status).toBe(200);
      expect(interceptedResponse.statusText).toBe("OK");
      expect(interceptedResponse.headers["x-custom-server-header"]).toBe(
        "served",
      );
      expect(interceptedResponse.timing.startedAt).toBeGreaterThan(0);
      expect(interceptedResponse.timing.duration).toBeGreaterThanOrEqual(0);
      expect(interceptedResponse.request.endpoint).toBe("/item/1");
      expect(interceptedResponse.request.method).toBe("GET");
      expect(data).toEqual({ id: 1, name: "Item", formatted: true });
    });

    it("should allow returning modified data directly from response interceptor", async () => {
      mockFetch(() => jsonResponse({ count: 5 }));

      const client = createClient({ baseURL: "https://api.test" });

      client.interceptors.response.use((res) => {
        // Return modified data directly
        return { count: res.data.count * 10 };
      });

      const result = await client.get<{ count: number }>("/count");
      expect(result).toEqual({ count: 50 });
    });
  });

  // =========================================================================
  // 4. Response Error Interceptors (Catch-all) & Recovery
  // =========================================================================
  describe("Response Error Interceptors", () => {
    it("should pass HTTP 4xx/5xx errors to response error interceptors as ApiError", async () => {
      let caughtError: any = null;

      mockFetch(() => {
        return jsonResponse(
          { error: "Not Found", code: 404 },
          { status: 404, statusText: "Not Found" },
        );
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: false,
      });

      client.interceptors.response.use(undefined, (error) => {
        caughtError = error;
        return Promise.reject(error);
      });

      await expect(client.get("/missing")).rejects.toThrow();

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.status).toBe(404);
      expect(caughtError.is4xx()).toBe(true);
      expect(caughtError.isNotFound()).toBe(true);
      expect(caughtError.data).toEqual({ error: "Not Found", code: 404 });
      expect(caughtError.request.url).toBe("https://api.test/missing");
    });

    it("should pass Network Errors to response error interceptors as ApiError", async () => {
      let caughtError: any = null;

      mockFetch(() => {
        throw new TypeError("Failed to fetch");
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: false,
      });

      client.interceptors.response.use(undefined, (error) => {
        caughtError = error;
        return Promise.reject(error);
      });

      await expect(client.get("/fail")).rejects.toThrow();

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.isNetworkError).toBe(true);
      expect(caughtError.status).toBe(0);
      expect(caughtError.request.url).toBe("https://api.test/fail");
    });

    it("should pass Validation Errors to response error interceptors as ApiError", async () => {
      let caughtError: any = null;

      mockFetch(() => jsonResponse({ valid: false }));

      const client = createClient({
        baseURL: "https://api.test",
        retry: false,
      });

      client.interceptors.response.use(undefined, (error) => {
        caughtError = error;
        return Promise.reject(error);
      });

      await expect(
        client.get("/validate-me", {
          validateResponse: (data: any) => data.valid === true,
        }),
      ).rejects.toThrow();

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.isValidationError).toBe(true);
      expect(caughtError.isValidation()).toBe(true);
    });

    it("should support Recovery / Refresh Token flow returning a successful retry", async () => {
      let callCount = 0;

      mockFetch((_url, init) => {
        callCount++;
        const authHeader = (init?.headers as Record<string, string>)
          ?.Authorization;

        if (callCount === 1) {
          // First attempt with expired token -> return 401
          return jsonResponse(
            { message: "Token expired" },
            { status: 401, statusText: "Unauthorized" },
          );
        }

        // Second attempt with refreshed token -> return 200
        expect(authHeader).toBe("Bearer refreshed-token-456");
        return jsonResponse({ secret: "data-revealed" });
      });

      const client = createClient({
        baseURL: "https://api.test",
        headers: { Authorization: "Bearer expired-token-123" },
        retry: false,
      });

      // Error interceptor implementing refresh-and-retry
      client.interceptors.response.use(
        (res) => res,
        async (error) => {
          if (
            error instanceof ApiError &&
            error.isUnauthorized() &&
            !error.request?.metadata?.isRetry
          ) {
            // 1. Refresh the token
            const newToken = "refreshed-token-456";
            client.setAuthToken(newToken);

            // 2. Retry the original request
            return client.request(
              error.request?.endpoint,
              error.request?.method,
              error.request?.body,
              {
                ...error.request?.options,
                headers: {
                  ...error.request?.options.headers,
                  Authorization: `Bearer ${newToken}`,
                },
                metadata: {
                  ...error.request?.metadata,
                  isRetry: true,
                },
              },
            );
          }
          return Promise.reject(error);
        },
      );

      const data = await client.get<{ secret: string }>("/protected");

      expect(callCount).toBe(2);
      expect(data).toEqual({ secret: "data-revealed" });
    });
  });

  // =========================================================================
  // 5. Interceptor Management (eject & clear)
  // =========================================================================
  describe("Interceptor Management", () => {
    it("should properly eject request interceptors by id", async () => {
      const logs: string[] = [];
      mockFetch(() => jsonResponse({ ok: true }));

      const client = createClient({ baseURL: "https://api.test" });

      const id1 = client.interceptors.request.use(() => {
        logs.push("int1");
      });
      const _id2 = client.interceptors.request.use(() => {
        logs.push("int2");
      });

      client.interceptors.request.eject(id1);

      await client.get("/test");

      expect(logs).toEqual(["int2"]);
    });

    it("should properly clear all interceptors", async () => {
      const logs: string[] = [];
      mockFetch(() => jsonResponse({ ok: true }));

      const client = createClient({ baseURL: "https://api.test" });

      client.interceptors.request.use(() => {
        logs.push("req");
      });
      client.interceptors.response.use((res) => {
        logs.push("res");
        return res;
      });

      client.interceptors.request.clear();
      client.interceptors.response.clear();

      await client.get("/test");

      expect(logs).toEqual([]);
    });
  });

  // =========================================================================
  // 6. Params Serializer Override
  // =========================================================================
  describe("Params Serializer Override", () => {
    it("should allow per-request paramsSerializer override", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));

      const client = createClient({
        baseURL: "https://api.test",
        paramsSerializer: { arrayFormat: "comma" },
      });

      // Default should use comma format
      await client.get("/users", { params: { roles: ["admin", "editor"] } });
      expect(fetchSpy.mock.calls[0][0]).toBe(
        "https://api.test/users?roles=admin%2Ceditor",
      );

      // Per-request override should use brackets format
      await client.get("/users", {
        params: { roles: ["admin", "editor"] },
        paramsSerializer: { arrayFormat: "brackets" },
      });
      expect(fetchSpy.mock.calls[1][0]).toBe(
        "https://api.test/users?roles%5B%5D=admin&roles%5B%5D=editor",
      );
    });
  });
});
