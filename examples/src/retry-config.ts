import { createClient } from "@api-zero/core";

const api = createClient({
  baseURL: "https://api.example.com",
  retry: {
    attempts: 3,
    delay: 1_000,
    backoff: "exponential",
    jitter: true,
    maxDelay: 30_000,
    // Honor Retry-After on 429 and 503 responses.
    respectRetryAfter: true,
    // Idempotent methods only. POST and PATCH are never retried
    // automatically unless you opt in below.
    retryMethods: ["GET", "PUT", "DELETE"],
    retryUnsafeMethods: false,
    onRetry: (event) => {
      console.warn(`attempt ${event.attempt} of ${event.maxAttempts}`);
    },
  },
});
