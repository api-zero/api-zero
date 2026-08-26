import { createClient } from "@api-zero/core";

//#region config
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
//#endregion

export async function perRequestOverride() {
  //#region per-request
  // Opt out for one call…
  await api.get("/health", { retry: false });

  // …or tighten the policy for another.
  await api.get("/report", {
    retry: {
      attempts: 5,
      delay: 500,
      retryCondition: (error) => error.is5xx(),
    },
  });
  //#endregion
}

export { api };
