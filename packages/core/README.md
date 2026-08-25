# @api-zero/core

A small, Fetch-based HTTP client whose value is reliable transport plus
runtime-validated contracts. No framework, no dependencies.

## What this package is for

Every project ends up with the same hand-written `api.ts`: a client wrapper, a
place to stash the auth token, an interceptor or two, and re-declared `.get` /
`.post` helpers. That file is what api-zero replaces.

It is the transport and contract layer. Cache, deduplication and server-state
lifecycle belong to [TanStack Query](https://tanstack.com/query) or
[SWR](https://swr.vercel.app) — api-zero is designed to sit underneath them, not
to compete with them.

## Installation

```bash
npm install @api-zero/core
# or
pnpm add @api-zero/core
```

Runs on Node.js 22+, modern browsers and Edge runtimes.

## Quick start

```ts
import { createClient } from "@api-zero/core";

const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
});

const user = await api.get<User>("/users/1");
const created = await api.post<User>("/users", { name: "Alice" });
```

## Structured errors

Every failure — HTTP status, network, timeout, abort, invalid JSON — arrives as
an `ApiError` carrying the context needed to act on it, instead of a bare
`TypeError: Failed to fetch`.

```ts
import { ApiError } from "@api-zero/core";

try {
  await api.get("/users/1");
} catch (error) {
  if (error instanceof ApiError) {
    error.status;      // 404
    error.request;     // method, resolved URL, headers, params
    error.attempt;     // which retry produced it
    error.cause;       // the original error, preserved
    error.isTimeout;   // timeout vs caller abort, kept distinct
    error.isAborted;

    if (error.is5xx()) { /* … */ }
    if (error.isNotFound()) { /* … */ }
  }
}
```

## Retries you can defend

Retries are conservative by default and never silently repeat an unsafe request.

```ts
const api = createClient({
  baseURL: "https://api.example.com",
  retry: {
    attempts: 3,
    delay: 1000,
    // exponential backoff with jitter, capped at maxDelay
    backoff: "exponential",
    jitter: true,
    maxDelay: 30_000,
    // Retry-After from 429/503 is honored
    respectRetryAfter: true,
    // idempotent methods only, unless you opt in explicitly
    retryMethods: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"],
    retryUnsafeMethods: false,
    onRetry: (event) => console.warn("retrying", event),
  },
});
```

Cancelling a request stops it during the backoff sleep too — it does not wait
out the delay before noticing.

## Interceptors

```ts
api.interceptors.request.use((context) => {
  context.headers["X-Request-Id"] = crypto.randomUUID();
  return context;
});

api.interceptors.response.use(
  (response) => {
    // Interceptors receive parsed data and timing, not a raw Response
    metrics.record(response.request.url, response.status, response.timing);
    return response;
  },
  (error) => {
    if (error.isUnauthorized()) redirectToLogin();
    throw error;
  },
);
```

Success handlers receive a `ResponseContext` — the request that produced it,
the parsed `data`, the status, the headers and timing. Rejection handlers see
every failure class, HTTP, network, timeout and validation alike, because errors
are normalized before the chain runs.

## Auth and headers

```ts
api.setAuthToken(token);        // Authorization: Bearer …
api.setBasicAuth(user, pass);
api.clearAuth();
api.setHeader("X-Tenant", "acme");
api.removeHeader("X-Tenant");
```

Set once on the client; every request carries it. That is the point.

## Cancellation and timeouts

```ts
const controller = new AbortController();
const promise = api.get("/slow", { signal: controller.signal });
controller.abort();
```

Timeout and caller cancellation compose into one signal, and the resulting error
tells you which one fired.

## Custom transports

`Transport` is a public contract, so a mock transport in tests needs no network
and no global patching.

```ts
import type { Transport } from "@api-zero/core";

const mock: Transport = { async send(context) { /* … */ } };
const api = createClient({ transport: mock });
```

`FetchTransport` is used everywhere; `XhrTransport` is selected automatically in
browsers when upload or download progress is requested.

## Typed contracts

For runtime-validated payloads with inferred types, add
[`@api-zero/zod`](https://www.npmjs.com/package/@api-zero/zod). For React
bindings, add [`@api-zero/react`](https://www.npmjs.com/package/@api-zero/react).

## License

MIT
