import type { ApiError } from "@api-zero/core";
import { api } from "./create-client";

declare function fetchNewToken(): Promise<string>;

// One refresh in flight at a time. Without this, ten concurrent 401s
// trigger ten refreshes and nine of them race.
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(undefined, async (error: ApiError) => {
  const request = error.request;

  // Only a 401, only once per request, and never for the refresh call
  // itself — otherwise a failing refresh loops forever.
  if (
    !error.isUnauthorized() ||
    !request ||
    request.metadata.retriedAfterRefresh ||
    request.endpoint === "/auth/refresh"
  ) {
    throw error;
  }

  refreshing ??= fetchNewToken().finally(() => {
    refreshing = null;
  });
  api.setAuthToken(await refreshing);

  // Replay the original request, tagged so it cannot come back here.
  return api.request(request.endpoint, request.method, request.body, {
    ...request.options,
    metadata: { ...request.metadata, retriedAfterRefresh: true },
  });
});
