import { createZodClient, ZodValidationError } from "@api-zero/zod";
import { z } from "zod";

const api = createZodClient({ baseURL: "https://api.example.com" });
const userSchema = z.object({ id: z.number(), name: z.string() });

try {
  await api.get("/users/1", userSchema);
} catch (error) {
  if (error instanceof ZodValidationError) {
    error.target; // "response" | "body"
    error.issues; // the original Zod issues
    error.status; // the HTTP status that carried the bad payload
  }
}
