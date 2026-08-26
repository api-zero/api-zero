import { api } from "./create-client";

interface User {
  id: number;
  name: string;
}

const user = await api.get<User>("/users/1");
const created = await api.post<User>("/users", { name: "Alice" });
const renamed = await api.patch<User>("/users/1", { name: "Alice B." });
await api.delete("/users/1");
