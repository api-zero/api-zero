# @api-zero/react

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- [`5fb8fd7`](https://github.com/api-zero/api-zero/commit/5fb8fd78531af30a949526e1ff01fcea799b53c0) Thanks [@gorkadev](https://github.com/gorkadev)! - First published release.

  api-zero is the transport and contract layer that removes the hand-written
  `api.ts` wrapper from a project: one configured client with auth, headers,
  interceptors, retries and structured errors, defined once and reachable
  everywhere.

  - `@api-zero/core` — Fetch-based client with a documented request lifecycle,
    pluggable transports, composed timeout/cancellation signals, conservative
    retries with backoff, jitter and `Retry-After`, and `ApiError` carrying the
    request context, cause and attempt count.
  - `@api-zero/react` — `ApiProvider` and `useApi`. Server-state caching stays
    with TanStack Query or SWR, which api-zero is designed to sit underneath.
  - `@api-zero/zod` — schema-validated responses and bodies with inferred types,
    reporting failures as `ZodValidationError` with the original Zod issues.

  Supported on Node.js 22+, modern browsers and Edge runtimes. Being a 0.x
  release, the public API may still change between minor versions.
