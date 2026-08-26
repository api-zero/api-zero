import { createZodClient } from "@api-zero/zod";
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().transform((value) => new Date(value)),
});

const api = createZodClient({ baseURL: "https://api.example.com" });

// Inferred as { id: number; name: string; email: string; createdAt: Date }
const user = await api.get("/users/1", userSchema);
const year = user.createdAt.getFullYear();
