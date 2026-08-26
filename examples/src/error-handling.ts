import { ApiError } from "@api-zero/core";
import { api } from "./create-client";

try {
  await api.get("/users/1");
} catch (error) {
  if (!(error instanceof ApiError)) throw error;

  if (error.isNotFound()) {
    // The resource is gone. Often not an error for the caller.
  } else if (error.isUnauthorized()) {
    // The session expired: send the user back to the login screen.
  } else if (error.isTimeout || error.isNetworkError) {
    // The request never produced a response.
  } else {
    throw error;
  }
}
