import { api } from "./create-client";

api.interceptors.request.use((context) => {
  // context.url is already resolved: baseURL, endpoint and the query
  // string are combined. Do not prepend baseURL again.
  console.log(`→ ${context.method} ${context.url}`);
  return context;
});
