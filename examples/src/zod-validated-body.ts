import { createZodClient } from "@api-zero/zod";
import { z } from "zod";

const userSchema = z.object({ id: z.number(), name: z.string() });
const createUser = z.object({ name: z.string().min(1) });

const api = createZodClient({ baseURL: "https://api.example.com" });

// The body is validated before the request leaves the process.
const created = await api.post(
  "/users",
  { name: "Alice" },
  { response: userSchema, body: createUser },
);
