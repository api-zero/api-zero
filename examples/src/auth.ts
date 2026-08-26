import { createClient } from "@api-zero/core";

const api = createClient({ baseURL: "https://api.example.com" });

//#region bearer
// Set once; every later request carries it.
api.setAuthToken("a-jwt-token");
//#endregion

//#region basic
api.setBasicAuth("username", "password");
//#endregion

//#region headers
api.setHeader("X-Tenant", "acme");
api.updateHeaders({ "Accept-Language": "en" });
api.removeHeader("X-Tenant");
//#endregion

export function signOut() {
  //#region clear
  api.clearAuth();
  //#endregion
}

export { api };
