import { ApiError } from "@api-zero/core";
import { api } from "./create-client";

try {
  await api.get("/users/1");
} catch (error) {
  if (error instanceof ApiError) {
    error.status; // 404
    error.request?.method; // "GET"
    error.request?.url; // fully resolved, query string included
    error.attempt; // which retry produced this failure
    error.cause; // the original error, preserved
    error.isAborted; // caller cancellation, distinct from a timeout
  }
}
