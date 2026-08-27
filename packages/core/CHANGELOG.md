# @api-zero/core

## 0.1.4

### Patch Changes

- [`4bb9c13`](https://github.com/api-zero/api-zero/commit/4bb9c134a80456063616000efce42b5b9407c933) Thanks [@gorkadev](https://github.com/gorkadev)! - Document every field of `ApiClientConfig`, `RequestOptions` and
  `TransportResponse` with JSDoc. Thirty fields had none, so editors showed a bare
  type on hover and the generated API reference showed an empty description.

## 0.1.3

### Patch Changes

- [`ec1ab6e`](https://github.com/api-zero/api-zero/commit/ec1ab6e92e42a119ec88e981abda7ae3fec4db8c) Thanks [@gorkadev](https://github.com/gorkadev)! - Allow asynchronous `transformRequest` and `transformResponse`.

  The pipeline has always awaited transforms, but their public types did not admit
  a `Promise` return. That made the documented adapter pattern
  `{ ...zodResponse(schema) }` fail to typecheck against a plain `ApiClient`, and
  forced `@api-zero/zod` to cast internally to compensate. The types now match the
  behaviour, and those casts are gone.

## 0.1.2

### Patch Changes

- [`fb57c1a`](https://github.com/api-zero/api-zero/commit/fb57c1aef1a26ad429c09f28562079830e313579) Thanks [@gorkadev](https://github.com/gorkadev)! - Documentation only: the published size figures are now measured from the built
  bundles rather than estimated, and CI enforces a ceiling on each so they cannot
  quietly stop being true.

## 0.1.1

### Patch Changes

- [`b7ef791`](https://github.com/api-zero/api-zero/commit/b7ef7911d44bfc1c25da2a8819a845821c667939) Thanks [@gorkadev](https://github.com/gorkadev)! - Correct the documented default for `retry.retryMethods`. The JSDoc claimed
  `['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']`, but the actual default is
  `['GET', 'PUT', 'DELETE']` and `HttpMethod` accepts neither `HEAD` nor
  `OPTIONS`. The README example carried the same mistake and would not have
  compiled.

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
