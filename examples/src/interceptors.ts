import { type ApiError, createClient } from "@api-zero/core";

const api = createClient({ baseURL: "https://api.example.com" });

//#region request
// Runs before every request. Return the context to keep the change.
const traceId = api.interceptors.request.use((context) => {
  context.headers["X-Request-Id"] = crypto.randomUUID();
  return context;
});
//#endregion

//#region response
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
//#endregion

//#region eject
// Interceptors can be removed with the id returned by use().
api.interceptors.request.eject(traceId);
//#endregion

export { api };
