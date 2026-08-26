import { api } from "./create-client";

// Per request, overriding the client default.
await api.get("/slow-report", { timeout: 30_000 });

// 0 disables the timeout for this request.
await api.get("/streaming", { timeout: 0 });
