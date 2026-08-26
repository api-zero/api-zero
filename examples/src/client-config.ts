import { api } from "./create-client";

// Merges into the existing configuration. Unlisted keys keep their value.
api.setConfig({
  timeout: 30_000,
  headers: { "X-App-Version": "2.0.0" },
});

const current = api.getConfig();
console.log(current.baseURL, current.timeout);
