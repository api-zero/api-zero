import { z } from "zod";

/**
 * One schema for the form and the request. The form protects the user
 * experience; the client protects the API from the code paths that never go
 * through a form — a retry, a script, a background job.
 */
export const createUser = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

export type CreateUser = z.infer<typeof createUser>;
