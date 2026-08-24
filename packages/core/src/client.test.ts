import { describe, expect, it } from "vitest";
import { ApiClient, createClient } from "./client";

describe("ApiClient", () => {
  it("should create a client instance", () => {
    const client = createClient({
      baseURL: "https://api.example.com",
    });
    expect(client).toBeInstanceOf(ApiClient);
    expect(client.getConfig().baseURL).toBe("https://api.example.com");
  });

  it("should have default config", () => {
    const client = createClient();
    expect(client.getConfig().timeout).toBe(30000);
  });
});
