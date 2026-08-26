import { ApiError } from "@api-zero/core";
import { api } from "./create-client";

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
