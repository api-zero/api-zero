import { createClient } from "@api-zero/core";

/**
 * On a server, one module-level client is shared by every request the process
 * handles. Anything request-scoped set on it — an auth token above all — leaks
 * into the next user's request. Build one per request instead.
 */
export function createRequestClient(token?: string) {
  const api = createClient({
    baseURL: "https://api.example.com",
    timeout: 10_000,
  });

  if (token) api.setAuthToken(token);
  return api;
}
