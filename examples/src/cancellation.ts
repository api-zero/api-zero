import { ApiError } from "@api-zero/core";
import { api } from "./quick-start";

export async function cancelInFlight() {
  //#region abort
  const controller = new AbortController();
  const promise = api.get("/slow-report", { signal: controller.signal });

  controller.abort();

  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError && error.isAborted) {
      // Cancelled by the caller, not by the timeout.
    }
  }
  //#endregion
}

export async function timeouts() {
  //#region timeout
  // Per request, overriding the client default.
  await api.get("/slow-report", { timeout: 30_000 });

  // 0 disables the timeout for this request.
  await api.get("/streaming", { timeout: 0 });
  //#endregion
}
