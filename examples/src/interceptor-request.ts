import { api } from "./create-client";

// Runs before every request. Return the context to keep the change.
const id = api.interceptors.request.use((context) => {
  context.headers["X-Request-Id"] = crypto.randomUUID();
  return context;
});

// Interceptors can be removed with the id returned by use().
api.interceptors.request.eject(id);
