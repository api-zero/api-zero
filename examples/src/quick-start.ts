import { createClient } from "@api-zero/core";
import type { User } from "./shared";

//#region create
const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});
//#endregion

export async function readAndWrite() {
  //#region verbs
  const user = await api.get<User>("/users/1");
  const created = await api.post<User>("/users", { name: "Alice" });
  const renamed = await api.patch<User>("/users/1", { name: "Alice B." });
  await api.delete("/users/1");
  //#endregion
  return { user, created, renamed };
}

export async function withQueryParams() {
  //#region params
  // → /users?role=admin&page=2
  const admins = await api.get<User[]>("/users", {
    params: { role: "admin", page: 2 },
  });
  //#endregion
  return admins;
}

export { api };
