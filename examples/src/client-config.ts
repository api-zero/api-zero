import { createClient } from "@api-zero/core";

const api = createClient({ baseURL: "https://api.example.com" });

export function reconfigure() {
  //#region set-config
  // Merges into the existing configuration. Unlisted keys keep their value.
  api.setConfig({
    timeout: 30_000,
    headers: { "X-App-Version": "2.0.0" },
  });

  const current = api.getConfig();
  console.log(current.baseURL, current.timeout);
  //#endregion
}

export async function genericRequest() {
  //#region request
  // Every verb is a thin wrapper over request(). Reach for it when the
  // method is decided at runtime.
  return api.request<{ ok: boolean }, { reason: string }>(
    "/resources/1",
    "DELETE",
    { reason: "cleanup" },
    { timeout: 15_000 },
  );
  //#endregion
}

export { api };
