import { createZodClient, ZodValidationError } from "@api-zero/zod";
import { z } from "zod";
import { createUser } from "./zod-shared-schema";

const api = createZodClient({ baseURL: "https://api.example.com" });
const userSchema = z.object({ id: z.number(), name: z.string() });

declare function setErrors(errors: Record<string, string[] | undefined>): void;

export async function submit(input: unknown) {
  try {
    return await api.post("/users", input, {
      response: userSchema,
      body: createUser,
    });
  } catch (error) {
    if (error instanceof ZodValidationError && error.target === "body") {
      // flatten() comes from Zod and produces exactly the shape a form wants.
      setErrors(error.flatten().fieldErrors);
      return;
    }
    throw error;
  }
}
