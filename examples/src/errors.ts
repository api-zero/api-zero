import { ApiError } from "@api-zero/core";
import { api } from "./quick-start";
import type { User } from "./shared";

export async function handleFailures(): Promise<User | null> {
  //#region handling
  try {
    return await api.get<User>("/users/1");
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    if (error.isNotFound()) return null;
    if (error.isUnauthorized()) {
      // The session expired: send the user back to the login screen.
      return null;
    }
    if (error.isTimeout || error.isNetworkError) {
      // The request never produced a response.
      return null;
    }
    throw error;
  }
  //#endregion
}

export async function inspectContext() {
  try {
    await api.get("/users/1");
  } catch (error) {
    if (error instanceof ApiError) {
      //#region context
      error.status; // 404
      error.request?.method; // "GET"
      error.request?.url; // fully resolved, query string included
      error.attempt; // which retry produced this failure
      error.cause; // the original error, preserved
      error.isAborted; // caller cancellation, distinct from a timeout
      //#endregion
    }
  }
}
