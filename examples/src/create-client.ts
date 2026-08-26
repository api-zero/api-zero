import { createClient } from "@api-zero/core";

export const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});
