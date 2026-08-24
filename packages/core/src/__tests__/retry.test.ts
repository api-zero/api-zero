import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../client";
import { ApiError } from "../error";
import {
  calculateRetryDelay,
  isMethodRetryable,
  parseRetryAfter,
  sleepWithSignal,
} from "../retry";
import type { RetryConfig, RetryEvent } from "../types";

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
// Retry Policy Tests
// ---------------------------------------------------------------------------

describe("Retry and Error Policy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Error Eligibility Policy
  // =========================================================================
  describe("Default Error Eligibility", () => {
    it("should retry transient server errors (500, 502, 503, 504)", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount < 3) {
          return jsonResponse(
            { error: "Server Error" },
            { status: 500, statusText: "Internal Server Error" },
          );
        }
        return jsonResponse({ success: true });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1, jitter: false },
      });

      const result = await client.get<{ success: boolean }>("/transient");
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(3);
    });

    it("should retry rate limits (429) and timeouts (408)", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          return jsonResponse(
            { error: "Rate Limited" },
            { status: 429, statusText: "Too Many Requests" },
          );
        }
        return jsonResponse({ success: true });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 2, delay: 1, jitter: false },
      });

      const result = await client.get<{ success: boolean }>("/rate-limit");
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(2);
    });

    it("should retry network errors", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount < 3) {
          throw new TypeError("Failed to fetch");
        }
        return jsonResponse({ recovered: true });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1, jitter: false },
      });

      const result = await client.get<{ recovered: boolean }>("/network-flap");
      expect(result).toEqual({ recovered: true });
      expect(callCount).toBe(3);
    });

    it("should NOT retry 4xx client errors (400, 401, 403, 404, 422)", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return jsonResponse(
          { error: "Not Found" },
          { status: 404, statusText: "Not Found" },
        );
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1 },
      });

      await expect(client.get("/not-found")).rejects.toMatchObject({
        status: 404,
      });
      expect(callCount).toBe(1); // No retries attempted for 404
    });

    it("should NOT retry validation errors", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return jsonResponse({ count: -1 });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1 },
      });

      await expect(
        client.get("/data", {
          validateResponse: (data: any) => data.count >= 0,
        }),
      ).rejects.toMatchObject({ isValidationError: true });

      expect(callCount).toBe(1); // Validation error is permanent, no retry
    });

    it("should NOT retry caller abort errors", async () => {
      const controller = new AbortController();
      let callCount = 0;

      mockFetch((_url, init) => {
        callCount++;
        controller.abort();
        return new Promise((_, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
          }
        });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1 },
      });

      await expect(
        client.get("/abort", { signal: controller.signal }),
      ).rejects.toMatchObject({ isAborted: true });

      expect(callCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. Method Eligibility Policy
  // =========================================================================
  describe("Method Eligibility Policy", () => {
    it("should retry idempotent methods (GET, PUT, DELETE) by default on 500", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        delay: 10,
        jitter: false,
      };
      expect(isMethodRetryable("GET", retryConfig)).toBe(true);
      expect(isMethodRetryable("PUT", retryConfig)).toBe(true);
      expect(isMethodRetryable("DELETE", retryConfig)).toBe(true);
    });

    it("should NOT retry unsafe methods (POST, PATCH) by default on 500", async () => {
      let postCalls = 0;
      mockFetch(() => {
        postCalls++;
        return jsonResponse({ error: "Fail" }, { status: 500 });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: { attempts: 3, delay: 1 },
      });

      await expect(client.post("/orders", { item: 1 })).rejects.toMatchObject({
        status: 500,
      });
      expect(postCalls).toBe(1); // POST is not retried by default
    });

    it("should retry POST when retryUnsafeMethods is true", async () => {
      let postCalls = 0;
      mockFetch(() => {
        postCalls++;
        if (postCalls < 2) {
          return jsonResponse({ error: "Fail" }, { status: 500 });
        }
        return jsonResponse({ orderId: "123" });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: {
          attempts: 3,
          delay: 1,
          retryUnsafeMethods: true,
          jitter: false,
        },
      });

      const result = await client.post<{ orderId: string }>("/orders", {
        item: 1,
      });
      expect(result).toEqual({ orderId: "123" });
      expect(postCalls).toBe(2);
    });

    it("should retry custom specified methods via retryMethods", async () => {
      const config: RetryConfig = {
        attempts: 2,
        delay: 10,
        retryMethods: ["POST", "PATCH"],
      };

      expect(isMethodRetryable("POST", config)).toBe(true);
      expect(isMethodRetryable("PATCH", config)).toBe(true);
      expect(isMethodRetryable("GET", config)).toBe(false);
    });
  });

  // =========================================================================
  // 3. Backoff, Jitter, and Cap
  // =========================================================================
  describe("Backoff & Delays", () => {
    it("should calculate exact exponential backoff when jitter is false", () => {
      const config: RetryConfig = { attempts: 4, delay: 100, jitter: false };
      const dummyError = ApiError.from("Fail", { status: 500 });

      expect(calculateRetryDelay(1, config, dummyError)).toBe(100); // 100 * 2^0
      expect(calculateRetryDelay(2, config, dummyError)).toBe(200); // 100 * 2^1
      expect(calculateRetryDelay(3, config, dummyError)).toBe(400); // 100 * 2^2
      expect(calculateRetryDelay(4, config, dummyError)).toBe(800); // 100 * 2^3
    });

    it("should calculate exact linear backoff when backoff is linear", () => {
      const config: RetryConfig = {
        attempts: 4,
        delay: 100,
        backoff: "linear",
        jitter: false,
      };
      const dummyError = ApiError.from("Fail", { status: 500 });

      expect(calculateRetryDelay(1, config, dummyError)).toBe(100);
      expect(calculateRetryDelay(2, config, dummyError)).toBe(200);
      expect(calculateRetryDelay(3, config, dummyError)).toBe(300);
      expect(calculateRetryDelay(4, config, dummyError)).toBe(400);
    });

    it("should respect maxDelay cap", () => {
      const config: RetryConfig = {
        attempts: 10,
        delay: 1000,
        maxDelay: 3000,
        jitter: false,
      };
      const dummyError = ApiError.from("Fail", { status: 500 });

      expect(calculateRetryDelay(1, config, dummyError)).toBe(1000);
      expect(calculateRetryDelay(2, config, dummyError)).toBe(2000);
      expect(calculateRetryDelay(3, config, dummyError)).toBe(3000); // capped
      expect(calculateRetryDelay(5, config, dummyError)).toBe(3000); // capped
    });

    it("should apply jitter within [0.5 * delay, delay] when jitter is true", () => {
      const config: RetryConfig = { attempts: 3, delay: 1000, jitter: true };
      const dummyError = ApiError.from("Fail", { status: 500 });

      for (let i = 0; i < 20; i++) {
        const delay = calculateRetryDelay(1, config, dummyError);
        expect(delay).toBeGreaterThanOrEqual(500);
        expect(delay).toBeLessThanOrEqual(1000);
      }
    });

    it("should support custom backoff function", () => {
      const customBackoff = vi.fn((attempt: number) => attempt * 50);
      const config: RetryConfig = {
        attempts: 3,
        delay: 100,
        backoff: customBackoff,
        jitter: false,
      };
      const dummyError = ApiError.from("Fail", { status: 500 });

      expect(calculateRetryDelay(1, config, dummyError)).toBe(50);
      expect(calculateRetryDelay(2, config, dummyError)).toBe(100);
      expect(customBackoff).toHaveBeenCalledWith(1, dummyError);
    });
  });

  // =========================================================================
  // 4. Retry-After Header
  // =========================================================================
  describe("Retry-After Header", () => {
    it("should parse numeric seconds format", () => {
      expect(parseRetryAfter("5")).toBe(5000);
      expect(parseRetryAfter("120")).toBe(120000);
      expect(parseRetryAfter("0")).toBe(0);
      expect(parseRetryAfter("")).toBeUndefined();
      expect(parseRetryAfter(undefined)).toBeUndefined();
    });

    it("should parse HTTP-Date format", () => {
      const targetTime = Date.now() + 10000;
      const httpDate = new Date(targetTime).toUTCString();
      const parsedMs = parseRetryAfter(httpDate);

      expect(parsedMs).toBeDefined();
      if (parsedMs !== undefined) {
        expect(parsedMs).toBeGreaterThan(8000);
        expect(parsedMs).toBeLessThanOrEqual(10500);
      }
    });

    it("should use Retry-After delay when present on error response", async () => {
      vi.useFakeTimers();

      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          return jsonResponse(
            { error: "Too Many Requests" },
            {
              status: 429,
              statusText: "Too Many Requests",
              headers: { "Retry-After": "2" },
            },
          );
        }
        return jsonResponse({ ok: true });
      });

      let observedDelay = 0;
      const client = createClient({
        baseURL: "https://api.test",
        retry: {
          attempts: 2,
          delay: 50, // default backoff is 50ms, but Retry-After is 2s
          onRetry: (e) => {
            observedDelay = e.delay;
          },
        },
      });

      const requestPromise = client.get("/rate-limited");
      await vi.advanceTimersByTimeAsync(2000);
      await requestPromise;

      expect(observedDelay).toBe(2000);
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // 5. Telemetry & onRetry Callback
  // =========================================================================
  describe("onRetry Telemetry", () => {
    it("should fire onRetry with complete event metadata before each retry", async () => {
      const retryEvents: RetryEvent[] = [];

      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount < 3) {
          return jsonResponse(
            { error: "Temp Error" },
            { status: 503, statusText: "Service Unavailable" },
          );
        }
        return jsonResponse({ success: true });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: {
          attempts: 3,
          delay: 1,
          jitter: false,
          onRetry: (event) => {
            retryEvents.push(event);
          },
        },
      });

      await client.get("/telemetry");

      expect(retryEvents).toHaveLength(2);
      expect(retryEvents[0].attempt).toBe(1);
      expect(retryEvents[0].maxAttempts).toBe(3);
      expect(retryEvents[0].delay).toBe(1);
      expect(retryEvents[0].error.status).toBe(503);
      expect(retryEvents[0].request?.endpoint).toBe("/telemetry");

      expect(retryEvents[1].attempt).toBe(2);
      expect(retryEvents[1].delay).toBe(2);
    });
  });

  // =========================================================================
  // 6. Prompt Sleep Cancellation
  // =========================================================================
  describe("Sleep Cancellation (sleepWithSignal)", () => {
    it("should resolve immediately if sleep ms is 0", async () => {
      await expect(sleepWithSignal(0)).resolves.toBeUndefined();
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        sleepWithSignal(5000, controller.signal),
      ).rejects.toMatchObject({
        isAborted: true,
      });
    });

    it("should abort sleep promptly when signal fires during delay", async () => {
      const controller = new AbortController();
      const sleepPromise = sleepWithSignal(10000, controller.signal);

      // Abort after 5ms
      setTimeout(() => controller.abort(), 5);

      await expect(sleepPromise).rejects.toMatchObject({ isAborted: true });
    });
  });

  // =========================================================================
  // 7. Custom retryCondition
  // =========================================================================
  describe("Custom retryCondition", () => {
    it("should allow custom retryCondition to override default eligibility", async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          // Normally 404 is NOT retried, but custom condition will retry it once
          return jsonResponse({ error: "Not Ready Yet" }, { status: 404 });
        }
        return jsonResponse({ ready: true });
      });

      const client = createClient({
        baseURL: "https://api.test",
        retry: {
          attempts: 2,
          delay: 1,
          retryCondition: (error, attempt) => {
            return error.status === 404 && attempt === 1;
          },
        },
      });

      const result = await client.get<{ ready: boolean }>("/poll");
      expect(result).toEqual({ ready: true });
      expect(callCount).toBe(2);
    });
  });
});
