import { api } from "./create-client";

// Every verb is a thin wrapper over request(). Reach for it when the
// method is decided at runtime.
const result = await api.request<{ ok: boolean }, { reason: string }>(
  "/resources/1",
  "DELETE",
  { reason: "cleanup" },
  { timeout: 15_000 },
);
