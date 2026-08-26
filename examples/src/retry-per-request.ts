import { api } from "./create-client";

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
