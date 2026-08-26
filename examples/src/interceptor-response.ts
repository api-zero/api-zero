import type { ApiError } from "@api-zero/core";
import { api } from "./create-client";

api.interceptors.response.use(
  (response) => {
    // Success handlers receive parsed data, not a raw Response.
    console.info(response.request.url, response.status, response.timing);
    return response;
  },
  (error: ApiError) => {
    // Rejection handlers see every failure class: HTTP, network,
    // timeout and validation alike.
    if (error.isUnauthorized()) {
      // redirect to login
    }
    throw error;
  },
);
