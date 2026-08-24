import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../client";
import { ApiError } from "../error";
import {
  createCompositeSignal,
  FetchTransport,
  findHeaderKey,
  type Transport,
  type TransportResponse,
  toBase64,
} from "../transport";

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

function emptyResponse(status = 204, statusText = "No Content"): Response {
  return new Response(null, {
    status,
    statusText,
    headers: { "Content-Length": "0" },
  });
}

// ---------------------------------------------------------------------------
// Transport Layer Tests
// ---------------------------------------------------------------------------

describe("Transport Layer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. FetchTransport
  // =========================================================================
  describe("FetchTransport", () => {
    it("should handle standard HTTP methods and JSON response", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ message: "hello" }));
      const transport = new FetchTransport();

      const client = createClient({ baseURL: "https://api.test", transport });
      const result = await client.post<{ message: string }>("/greet", {
        name: "World",
      });

      expect(result).toEqual({ message: "hello" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.test/greet");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ name: "World" }));
    });

    it("should handle various responseTypes: text, blob, arrayBuffer", async () => {
      mockFetch((url) => {
        if (url.includes("/text")) return new Response("plain text content");
        if (url.includes("/blob"))
          return new Response(new Blob(["binary data"]));
        if (url.includes("/buffer")) return new Response(new ArrayBuffer(8));
        return jsonResponse({});
      });

      const client = createClient({ baseURL: "https://api.test" });

      const text = await client.get("/text", { responseType: "text" });
      expect(text).toBe("plain text content");

      const blob = await client.get<Blob>("/blob", { responseType: "blob" });
      expect(blob).toBeInstanceOf(Blob);

      const buffer = await client.get<ArrayBuffer>("/buffer", {
        responseType: "arrayBuffer",
      });
      expect(buffer).toBeInstanceOf(ArrayBuffer);
    });

    it("should handle empty response bodies gracefully (204, 205, content-length: 0)", async () => {
      mockFetch((url) => {
        if (url.includes("/204")) return emptyResponse(204, "No Content");
        if (url.includes("/205")) return emptyResponse(205, "Reset Content");
        return new Response(null, { headers: { "Content-Length": "0" } });
      });

      const client = createClient({ baseURL: "https://api.test" });

      expect(await client.delete("/204")).toBeNull();
      expect(await client.post("/205")).toBeNull();
      expect(await client.get("/empty")).toBeNull();
    });

    it("should remove Content-Type header for FormData to allow runtime boundary generation", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ uploaded: true }));
      const client = createClient({
        baseURL: "https://api.test",
        headers: { "content-type": "application/json" },
      });

      const formData = new FormData();
      formData.append("file", "test");

      await client.post("/upload", formData);

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(findHeaderKey(headers, "Content-Type")).toBeUndefined();
    });

    it("should correctly handle falsy request bodies (0, false, empty string)", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ received: true }));
      const client = createClient({ baseURL: "https://api.test" });

      await client.post("/number", 0);
      expect(fetchSpy.mock.calls[0][1]?.body).toBe("0");

      await client.post("/boolean", false);
      expect(fetchSpy.mock.calls[1][1]?.body).toBe("false");

      await client.post("/empty-string", "");
      expect(fetchSpy.mock.calls[2][1]?.body).toBe('""');
    });

    it("should throw ApiError with status and payload when response.ok is false", async () => {
      mockFetch(() =>
        jsonResponse(
          { error: "Unauthorized", code: 401 },
          { status: 401, statusText: "Unauthorized" },
        ),
      );

      const client = createClient({
        baseURL: "https://api.test",
        retry: false,
      });

      await expect(client.get("/private")).rejects.toThrow();
      try {
        await client.get("/private");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(401);
        expect(apiErr.isUnauthorized()).toBe(true);
        expect(apiErr.data).toEqual({ error: "Unauthorized", code: 401 });
      }
    });
  });

  // =========================================================================
  // 2. Timeout vs Caller Abort & Composite Signal
  // =========================================================================
  describe("Composite Signal & Cancellation", () => {
    it("should distinguish timeout cancellation (isTimeout: true, status: 408)", async () => {
      mockFetch(
        (_url, init) =>
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

      const client = createClient({
        baseURL: "https://api.test",
        timeout: 10,
        retry: false,
      });

      await expect(client.get("/slow")).rejects.toMatchObject({
        isTimeout: true,
        status: 408,
      });
    });

    it("should distinguish caller abort cancellation (isAborted: true, status: 0)", async () => {
      const controller = new AbortController();

      mockFetch(
        (_url, init) =>
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

      const client = createClient({
        baseURL: "https://api.test",
        timeout: 5000,
        retry: false,
      });
      const promise = client.get("/slow", { signal: controller.signal });

      setTimeout(() => controller.abort(), 10);

      await expect(promise).rejects.toMatchObject({
        isAborted: true,
        status: 0,
      });
    });

    it("should immediately abort when signal is already aborted before call", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));
      const controller = new AbortController();
      controller.abort(); // Pre-abort

      const client = createClient({
        baseURL: "https://api.test",
        retry: false,
      });

      await expect(
        client.get("/data", { signal: controller.signal }),
      ).rejects.toMatchObject({
        isAborted: true,
        status: 0,
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should cleanly remove event listeners upon completion", async () => {
      const controller = new AbortController();
      const signal = controller.signal;

      const composite = createCompositeSignal(1000, signal);
      expect(composite.isAborted()).toBe(false);
      expect(composite.isTimeout()).toBe(false);

      composite.cleanup();
      // Should not throw or retain timer
    });
  });

  // =========================================================================
  // 3. XhrTransport
  // =========================================================================
  describe("XhrTransport", () => {
    it("should throw Unsupported Runtime error when XMLHttpRequest is undefined", async () => {
      const originalXHR = (globalThis as any).XMLHttpRequest;
      delete (globalThis as any).XMLHttpRequest;

      try {
        const client = createClient({
          baseURL: "https://api.test",
          retry: false,
        });

        // Requesting upload progress triggers XhrTransport selection
        await expect(
          client.post(
            "/upload",
            { file: "content" },
            { onUploadProgress: () => {} },
          ),
        ).rejects.toMatchObject({
          statusText: "Unsupported Runtime",
        });
      } finally {
        if (originalXHR) {
          (globalThis as any).XMLHttpRequest = originalXHR;
        }
      }
    });

    it("should handle progress tracking in an environment with XMLHttpRequest", async () => {
      let uploadProgressCalled = false;
      let downloadProgressCalled = false;

      // Mock XMLHttpRequest class
      class MockXMLHttpRequest {
        status = 200;
        statusText = "OK";
        responseText = JSON.stringify({ success: true });
        response = JSON.stringify({ success: true });
        upload = { onprogress: null as any };
        onprogress: any = null;
        onload: any = null;
        onerror: any = null;
        ontimeout: any = null;
        onabort: any = null;
        withCredentials = false;
        timeout = 0;

        open(_method: string, _url: string) {}
        setRequestHeader(_key: string, _val: string) {}
        getAllResponseHeaders() {
          return "content-type: application/json\r\nx-custom: val";
        }
        send(_body?: any) {
          if (this.upload.onprogress) {
            uploadProgressCalled = true;
            this.upload.onprogress({
              lengthComputable: true,
              loaded: 50,
              total: 100,
            } as any);
          }
          if (this.onprogress) {
            downloadProgressCalled = true;
            this.onprogress({
              lengthComputable: true,
              loaded: 100,
              total: 100,
            } as any);
          }
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      (globalThis as any).XMLHttpRequest = MockXMLHttpRequest;

      const client = createClient({ baseURL: "https://api.test" });

      const result = await client.post<{ success: boolean }>(
        "/upload",
        { data: "sample" },
        {
          onUploadProgress: (_e) => {},
          onDownloadProgress: (_e) => {},
        },
      );

      expect(result).toEqual({ success: true });
      expect(uploadProgressCalled).toBe(true);
      expect(downloadProgressCalled).toBe(true);
    });
  });

  // =========================================================================
  // 4. Custom & Injected Transport
  // =========================================================================
  describe("Custom / Injected Transport", () => {
    it("should delegate execution 100% to custom injected transport", async () => {
      let receivedContext: any = null;

      const customTransport: Transport = {
        async send(context): Promise<TransportResponse> {
          receivedContext = context;
          return {
            status: 200,
            statusText: "OK",
            headers: { "x-mock": "true" },
            data: { customTransportExecuted: true },
          };
        },
      };

      const client = createClient({
        baseURL: "https://mock.service",
        transport: customTransport,
      });

      const data = await client.get("/custom-endpoint");

      expect(receivedContext).not.toBeNull();
      expect(receivedContext.url).toBe("https://mock.service/custom-endpoint");
      expect(data).toEqual({ customTransportExecuted: true });
    });
  });

  // =========================================================================
  // 5. Universal Base64
  // =========================================================================
  describe("toBase64 & Basic Auth", () => {
    it("should correctly encode ASCII strings to base64", () => {
      expect(toBase64("admin:password123")).toBe("YWRtaW46cGFzc3dvcmQxMjM=");
    });

    it("should set correct Authorization Basic header in client", () => {
      const client = createClient();
      client.setBasicAuth("user", "secret");

      const headers = client.getConfig().headers;
      expect(headers?.Authorization).toBe(`Basic ${toBase64("user:secret")}`);
    });
  });
});
