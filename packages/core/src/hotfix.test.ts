import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./client";

// ---------------------------------------------------------------------------
// Helpers — mock fetch globally for deterministic tests
// ---------------------------------------------------------------------------

function mockFetch(handler: (url: string, init?: RequestInit) => Response) {
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

function emptyResponse(status: number, statusText = ""): Response {
  return new Response(null, {
    status,
    statusText,
    headers: { "Content-Length": "0" },
  });
}

// ---------------------------------------------------------------------------
// Phase 0 — Hot Fix Tests
// ---------------------------------------------------------------------------

describe("Phase 0 Hot Fixes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Fix 1: timeout = 0 should be representable (not fallback to 30000)
  // -----------------------------------------------------------------------
  describe("timeout = 0 (nullish coalescing fix)", () => {
    it("should preserve timeout=0 in effective config, not replace with 30000", () => {
      // The core of the fix: `config.timeout ?? 30000` instead of `config.timeout || 30000`
      // With ||, timeout=0 is falsy → becomes 30000. With ??, 0 is kept.
      const client = createClient({ timeout: 0 });
      expect(client.getConfig().timeout).toBe(0);
    });

    it("should abort with small timeout values instead of defaulting to 30000", async () => {
      // This verifies that small timeout values (like 10ms) actually cause timeout,
      // proving they don't fall back to 30000ms via the old || operator bug.
      // The mock fetch must respect AbortSignal like the real fetch does.
      vi.useRealTimers();

      vi.stubGlobal(
        "fetch",
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((resolve, reject) => {
            const timer = setTimeout(
              () => resolve(jsonResponse({ ok: true })),
              500,
            );
            if (init?.signal) {
              init.signal.addEventListener("abort", () => {
                clearTimeout(timer);
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              });
            }
          }),
      );

      const client = createClient({ baseURL: "https://api.test", timeout: 10 });
      await expect(client.get("/data")).rejects.toMatchObject({
        isTimeout: true,
      });
    });

    it("should still default to 30000 when timeout is undefined", () => {
      const client = createClient();
      expect(client.getConfig().timeout).toBe(30000);
    });

    it("should still default to 30000 when timeout is not provided per-request", async () => {
      // Verify the constructor default is still 30000
      const client = createClient();
      expect(client.getConfig().timeout).toBe(30000);
    });
  });

  // -----------------------------------------------------------------------
  // Fix 2: falsy bodies should not be dropped
  // -----------------------------------------------------------------------
  describe("falsy body handling (body != null fix)", () => {
    it("should send body=0 as JSON", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ received: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/data", 0);
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.body).toBe("0");
    });

    it("should send body=false as JSON", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ received: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/data", false);
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.body).toBe("false");
    });

    it('should send body="" (empty string) as JSON', async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ received: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/data", "");
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.body).toBe('""');
    });

    it("should not send body when it is undefined", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.get("/data");
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.body).toBeUndefined();
    });

    it("should not send body when it is null", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/data", null);
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.body).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Fix 3: 204 No Content should not produce a misleading network error
  // -----------------------------------------------------------------------
  describe("204 No Content handling (empty body fix)", () => {
    it("should return null for 204 No Content", async () => {
      mockFetch(() => emptyResponse(204, "No Content"));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.delete("/resource/1");
      vi.advanceTimersByTime(0);
      const result = await promise;

      expect(result).toBeNull();
    });

    it("should return null for 205 Reset Content", async () => {
      mockFetch(() => emptyResponse(205, "Reset Content"));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/action");
      vi.advanceTimersByTime(0);
      const result = await promise;

      expect(result).toBeNull();
    });

    it("should return null for content-length: 0", async () => {
      mockFetch(
        () =>
          new Response(null, {
            status: 200,
            statusText: "OK",
            headers: { "Content-Length": "0" },
          }),
      );
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.get("/empty");
      vi.advanceTimersByTime(0);
      const result = await promise;

      expect(result).toBeNull();
    });

    it("should parse JSON normally for non-empty 200 responses", async () => {
      mockFetch(() => jsonResponse({ id: 1, name: "test" }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.get("/data");
      vi.advanceTimersByTime(0);
      const result = await promise;

      expect(result).toEqual({ id: 1, name: "test" });
    });

    it("should return null for empty string body with json responseType", async () => {
      mockFetch(
        () =>
          new Response("", {
            status: 200,
            statusText: "OK",
          }),
      );
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.get("/empty-string");
      vi.advanceTimersByTime(0);
      const result = await promise;

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Fix 4: case-insensitive header handling for Content-Type
  // -----------------------------------------------------------------------
  describe("case-insensitive Content-Type header handling", () => {
    it("should not duplicate Content-Type when set with different casing", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({
        baseURL: "https://api.test",
        headers: { "content-type": "application/xml" },
      });

      const promise = client.post("/data", { key: "value" });
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;

      // Should preserve the existing "content-type" and NOT add "Content-Type"
      expect(headers["content-type"]).toBe("application/xml");
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("should set Content-Type to application/json when no content-type header exists", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({ baseURL: "https://api.test" });

      const promise = client.post("/data", { key: "value" });
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;

      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should remove Content-Type (any casing) for FormData", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const client = createClient({
        baseURL: "https://api.test",
        headers: { "content-type": "application/json" },
      });

      const formData = new FormData();
      formData.append("file", "content");

      const promise = client.post("/upload", formData);
      vi.advanceTimersByTime(0);
      await promise;

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;

      // Content-Type (in any casing) should be removed for FormData
      expect(headers["content-type"]).toBeUndefined();
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });
});
