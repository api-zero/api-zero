import { api } from "./create-client";

api.setHeader("X-Tenant", "acme");
api.updateHeaders({ "Accept-Language": "en" });
api.removeHeader("X-Tenant");
