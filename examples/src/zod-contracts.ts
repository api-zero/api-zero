import { createZodClient, ZodValidationError } from "@api-zero/zod";
import { z } from "zod";

//#region schema
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().transform((value) => new Date(value)),
});

const api = createZodClient({ baseURL: "https://api.example.com" });
//#endregion

export async function typedResponse() {
  //#region get
  // Inferred as { id: number; name: string; email: string; createdAt: Date }
  const user = await api.get("/users/1", userSchema);
  return user.createdAt.getFullYear();
  //#endregion
}

export async function validatedBody() {
  //#region post
  const createUser = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  // The body is validated before the request leaves the process.
  return api.post(
    "/users",
    { name: "Alice", email: "alice@example.com" },
    {
      response: userSchema,
      body: createUser,
    },
  );
  //#endregion
}

export async function handleValidationFailure() {
  //#region error
  try {
    await api.get("/users/1", userSchema);
  } catch (error) {
    if (error instanceof ZodValidationError) {
      error.target; // "response" | "body"
      error.issues; // the original Zod issues
      error.status; // the HTTP status that carried the bad payload
    }
  }
  //#endregion
}

export function underlyingClient() {
  //#region client
  // The schema-aware client wraps a plain ApiClient and exposes it.
  // Configuring one configures the other: it is the same instance.
  api.client.setAuthToken("a-jwt-token");
  //#endregion
}

export { api, userSchema };
