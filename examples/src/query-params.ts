import { api } from "./create-client";

// GET /users?role=admin&page=2
const admins = await api.get<unknown[]>("/users", {
  params: { role: "admin", page: 2 },
});
