import { createClient } from "@api-zero/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { zodBody, zodContract, zodResponse } from "../adapters";
import { createZodClient, withZod } from "../client";
import { ZodValidationError } from "../error";

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
// Schemas
// ---------------------------------------------------------------------------

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().transform((str) => new Date(str)),
});

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

// ---------------------------------------------------------------------------
// Zod Integration Test Suite
// ---------------------------------------------------------------------------

describe("@api-zero/zod Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. zodResponse adapter
  // =========================================================================
  describe("zodResponse", () => {
    it("should validate and transform response data with full type inference", async () => {
      mockFetch(() =>
        jsonResponse({
          id: 1,
          name: "Alice",
          email: "alice@example.com",
          createdAt: "2026-08-18T00:00:00.000Z",
        }),
      );

      const client = createClient({ baseURL: "https://api.test" });
      const user = await client.get("/users/1", zodResponse(UserSchema));

      expect(user.id).toBe(1);
      expect(user.name).toBe("Alice");
      expect(user.email).toBe("alice@example.com");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.toISOString()).toBe("2026-08-18T00:00:00.000Z");
    });

    it("should throw ZodValidationError with detailed issues on invalid response data", async () => {
      mockFetch(() =>
        jsonResponse({
          id: "not-a-number",
          name: "Alice",
          email: "invalid-email",
          createdAt: "2026-08-18T00:00:00.000Z",
        }),
      );

      const client = createClient({ baseURL: "https://api.test" });

      try {
        await client.get("/users/1", zodResponse(UserSchema));
        expect.unreachable("Should have thrown ZodValidationError");
      } catch (err) {
        expect(err).toBeInstanceOf(ZodValidationError);
        const valErr = err as ZodValidationError;

        expect(valErr.target).toBe("response");
        expect(valErr.isValidationError).toBe(true);
        expect(valErr.isValidation()).toBe(true);
        expect(valErr.issues.length).toBeGreaterThanOrEqual(2);

        const flattened = valErr.flatten();
        expect(flattened.fieldErrors).toHaveProperty("id");
        expect(flattened.fieldErrors).toHaveProperty("email");

        const formatted = valErr.format();
        expect(formatted).toHaveProperty("id");
        expect(formatted).toHaveProperty("email");
      }
    });
  });

  // =========================================================================
  // 2. zodBody adapter
  // =========================================================================
  describe("zodBody", () => {
    it("should validate valid outbound body and send request", async () => {
      const fetchSpy = mockFetch(() =>
        jsonResponse({ id: 101, status: "created" }),
      );

      const client = createClient({ baseURL: "https://api.test" });
      const payload = { name: "Bob", email: "bob@example.com" };

      const result = await client.post(
        "/users",
        payload,
        zodBody(CreateUserSchema),
      );

      expect(result).toEqual({ id: 101, status: "created" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should throw ZodValidationError on invalid body and prevent network dispatch", async () => {
      const fetchSpy = mockFetch(() => jsonResponse({ ok: true }));

      const client = createClient({ baseURL: "https://api.test" });
      const invalidPayload = { name: "A", email: "not-an-email" };

      try {
        await client.post("/users", invalidPayload, zodBody(CreateUserSchema));
        expect.unreachable("Should have thrown ZodValidationError");
      } catch (err) {
        expect(err).toBeInstanceOf(ZodValidationError);
        const valErr = err as ZodValidationError;

        expect(valErr.target).toBe("body");
        expect(valErr.isValidationError).toBe(true);
        expect(valErr.flatten().fieldErrors).toHaveProperty("name");
        expect(valErr.flatten().fieldErrors).toHaveProperty("email");

        // Network was never touched!
        expect(fetchSpy).not.toHaveBeenCalled();
      }
    });
  });

  // =========================================================================
  // 4. zodContract combined adapter
  // =========================================================================
  describe("zodContract", () => {
    it("should validate both outbound body and incoming response", async () => {
      mockFetch(() =>
        jsonResponse({
          id: 42,
          name: "Charlie",
          email: "charlie@example.com",
          createdAt: "2026-08-18T00:00:00.000Z",
        }),
      );

      const client = createClient({ baseURL: "https://api.test" });

      const user = await client.post(
        "/users",
        { name: "Charlie", email: "charlie@example.com" },
        zodContract({
          body: CreateUserSchema,
          response: UserSchema,
        }),
      );

      expect(user.id).toBe(42);
      expect(user.createdAt).toBeInstanceOf(Date);
    });
  });

  // =========================================================================
  // 5. ZodApiClient / withZod wrapper
  // =========================================================================
  describe("ZodApiClient / withZod", () => {
    it("should provide typed helper methods for all HTTP verbs", async () => {
      mockFetch((_url, init) => {
        if (init?.method === "GET") {
          return jsonResponse({
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          });
        }
        if (init?.method === "POST") {
          return jsonResponse({
            id: 2,
            name: "Bob",
            email: "bob@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          });
        }
        if (init?.method === "DELETE") {
          return jsonResponse({ deleted: true });
        }
        return jsonResponse({});
      });

      const api = createZodClient({ baseURL: "https://api.test" });

      // GET
      const user = await api.get("/users/1", UserSchema);
      expect(user.id).toBe(1);
      expect(user.createdAt).toBeInstanceOf(Date);

      // POST with body and response schemas
      const newUser = await api.post(
        "/users",
        { name: "Bob", email: "bob@example.com" },
        { response: UserSchema, body: CreateUserSchema },
      );
      expect(newUser.id).toBe(2);

      // DELETE
      const deleteResult = await api.delete(
        "/users/1",
        z.object({ deleted: z.boolean() }),
      );
      expect(deleteResult.deleted).toBe(true);
    });

    it("should expose the same underlying client, so configuring it configures both", () => {
      const client = createClient({ baseURL: "https://api.test" });
      const api = withZod(client);

      expect(api.client).toBe(client);

      api.client.setAuthToken("jwt-token-xyz");
      expect(client.getConfig().headers?.Authorization).toBe(
        "Bearer jwt-token-xyz",
      );
    });
  });

  // =========================================================================
  // 7. PUT, PATCH, Array Schemas & Interceptor Integration
  // =========================================================================
  describe("Extended Verbs, Arrays & Interceptors", () => {
    it("should support PUT and PATCH methods on ZodApiClient", async () => {
      mockFetch((_url, init) => {
        if (init?.method === "PUT") {
          return jsonResponse({
            id: 1,
            name: "Alice Updated",
            email: "alice@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          });
        }
        if (init?.method === "PATCH") {
          return jsonResponse({
            id: 1,
            name: "Alice Patched",
            email: "alice@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          });
        }
        return jsonResponse({});
      });

      const api = createZodClient({ baseURL: "https://api.test" });

      const updated = await api.put(
        "/users/1",
        { name: "Alice Updated", email: "alice@example.com" },
        {
          response: UserSchema,
          body: CreateUserSchema,
        },
      );
      expect(updated.name).toBe("Alice Updated");

      const patched = await api.patch(
        "/users/1",
        { name: "Alice Patched", email: "alice@example.com" },
        {
          response: UserSchema,
          body: CreateUserSchema,
        },
      );
      expect(patched.name).toBe("Alice Patched");
    });

    it("should validate and infer arrays of schemas", async () => {
      mockFetch(() =>
        jsonResponse([
          {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          },
          {
            id: 2,
            name: "Bob",
            email: "bob@example.com",
            createdAt: "2026-08-18T00:00:00.000Z",
          },
        ]),
      );

      const client = createClient({ baseURL: "https://api.test" });
      const UsersArraySchema = z.array(UserSchema);

      const users = await client.get("/users", zodResponse(UsersArraySchema));
      expect(users).toHaveLength(2);
      expect(users[0].name).toBe("Alice");
      expect(users[1].name).toBe("Bob");
      expect(users[0].createdAt).toBeInstanceOf(Date);
    });

    it("should allow response error interceptors to catch and handle ZodValidationError", async () => {
      mockFetch(() => jsonResponse({ invalid: "data" }));

      const client = createClient({ baseURL: "https://api.test" });
      let interceptedError: unknown = null;

      client.interceptors.response.use(undefined, (error) => {
        interceptedError = error;
        throw error;
      });

      await expect(
        client.get("/data", zodResponse(UserSchema)),
      ).rejects.toBeInstanceOf(ZodValidationError);
      expect(interceptedError).toBeInstanceOf(ZodValidationError);
      expect((interceptedError as ZodValidationError).isValidationError).toBe(
        true,
      );
    });
  });
});
