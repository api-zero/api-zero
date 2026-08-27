import { createZodClient, ZodValidationError } from "@api-zero/zod";

const api = createZodClient({ baseURL: "https://api.example.com" });

declare const logger: { error: (message: string, meta: unknown) => void };

/**
 * A response that fails its schema is a contract break, not a user error.
 * This is the record that tells you when the API changed and which field moved.
 */
api.client.interceptors.response.use(undefined, (error) => {
  if (error instanceof ZodValidationError && error.target === "response") {
    logger.error("contract broken", {
      url: error.request?.url,
      issues: error.issues,
    });
  }
  throw error;
});
