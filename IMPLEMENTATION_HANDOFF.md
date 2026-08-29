# api-zero — Implementation Handoff

> **Historical.** Every checkpoint below is complete and shipped as 0.1.5. Kept
> for the reasoning, not as instructions; the current state is in `docs/adr/`
> and `docs/plans/`.

This document was the working brief for the next agent. It is intentionally self-contained: read it before changing the code, then work through the checkpoints in order. Do **not** attempt a broad rewrite or feature-parity race with Axios/Ky.

## Product direction

api-zero should be a small, portable Fetch-based HTTP client whose value is **reliable transport plus runtime-validated contracts**, with optional integrations rather than framework lock-in.

The intended differentiators are:

1. Typed request/params/response contracts, initially through an optional Zod integration.
2. A predictable lifecycle with rich, structured errors.
3. Safe retry/timeout/cancellation defaults.
4. A core independent of React, plus focused integrations for React/TanStack Query/SWR.
5. Small optional plugins/adapters for authentication, observability and validation.

TanStack Query/SWR remain responsible for cache, deduplication and server-state lifecycle. api-zero is the transport and contract layer.

## Repository map

| Path | Responsibility |
| --- | --- |
| `packages/core` | Client, transport behavior, errors, interceptors, retries, params and public types. |
| `packages/react` | `ApiProvider` and `useApi`; currently a thin React Context wrapper. |
| `apps/docs` | Next.js + Fumadocs documentation site, MDX content, search, OG images and LLM text route. |
| `.changeset` | Versioning/release changesets. |

The monorepo uses pnpm, Turborepo, TypeScript, tsup, Vitest, Vite, Next.js and Fumadocs.

## Verified baseline

- `pnpm test` completed successfully on 2026-08-13: core and React build, 2 core tests pass, and docs build.
- The docs build has non-blocking warnings about Shiki externalization and missing Next `metadataBase`.
- The working tree was already substantially dirty before this document was added. Preserve unrelated user changes.

## Current public API

Core exports `ApiClient`, `createClient`, `ApiError`, `InterceptorManager`, `serializeParams`, `withRetry` and types.

`ApiClient` currently exposes:

- `get`, `post`, `put`, `patch`, `delete`, and generic `request`.
- config with `baseURL`, headers, timeout, credentials, retry, transformations and parameter serialization.
- mutators for config, headers and bearer/basic authentication.
- request and response interceptor managers.

React exports `ApiProvider` (accepts config) and `useApi`.

## Observed gaps and correctness issues

Treat this list as the initial backlog. Confirm behavior with new tests before changing it.

### Lifecycle and API contract

- `RequestOptions` lacks the `method`, final URL and body fields that documentation examples claim interceptors can inspect or alter.
- Response interceptors receive native `Response`, not parsed data; examples that use `response.data` cannot work.
- Response interceptor rejection handlers do not receive HTTP, network, timeout or validation errors: HTTP status checking occurs after the interceptor chain.
- Per-request `transformRequest` and `transformResponse` are declared but ignored; only client-level transforms run.
- `debug` and `logger` are declared and documented but unused.
- Per-request params serializer is documented but unavailable in `RequestOptions`; serialization currently reads `this.config.paramsSerializer` instead of effective request config.

### Transport and runtime compatibility

- XHR is selected only for `onUploadProgress`; download progress alone continues through Fetch and never fires `onDownloadProgress`.
- The XHR path must be browser-only. Server/edge runtime support must be explicit and graceful.
- `setBasicAuth` uses `btoa`, which needs a portable strategy or a clearly documented browser-only limitation.
- Timeout/cancellation should combine signals safely, clean up listeners, and handle a signal already aborted before the request starts.
- `config.timeout || 30000` means `0` cannot be represented deliberately.
- JSON parsing of an empty successful response (notably `204`) becomes a misleading network error.
- `if (body)` drops meaningful falsy request bodies (`false`, `0`, empty string).
- Header handling should be case-insensitive when adding/removing `Content-Type`, especially for `FormData`.

### Retry/error semantics

- Retries are opt-in and retry every thrown error if no `retryCondition` is supplied.
- No idempotency/method-aware policy, jitter, cap, `Retry-After`, retry telemetry or cancellation during retry sleep exists.
- `ApiError` is a useful beginning but needs a dependable context: method, resolved URL, original cause, retry attempt and optional response metadata.
- Validation is a boolean callback; no schema-contract integration exists.

### Packaging, tests and docs

- Core only has two creation/default-timeout tests. There are no contract, mock-transport, retry, abort, XHR or React tests.
- `packages/react/tsup.config.ts` externalizes `@better-call/core`, not the actual `@api-zero/core` dependency. Correct this during packaging work and verify the packed artifact.
- Package metadata lacks publish-oriented fields such as repository, license, files/side-effects policy and publish configuration (decide these deliberately).
- Documentation contains leftover `Better Call` names/imports/links and examples for API members that do not exist. Correct docs only after the target API is settled.
- React API-reference pages exist but are not included in `content/docs/react/meta.json`.

## Required implementation sequence

### Checkpoint 0 — Scope and naming

**Goal:** establish a stable target before behavior changes.

1. Confirm package names, npm scope, repository URL, supported runtimes and browser/server/edge policy.
2. Decide whether Zod is the first-class contract integration. Recommended: yes, but as `@api-zero/zod`, not a core dependency.
3. Inventory documentation that still references Better Call. Do not claim bundle size without measuring it in CI.

**Acceptance:** a short ADR or update to this document records the decisions; no remaining ambiguity about runtime support.

### Checkpoint 1 — Define the core lifecycle contract

**Goal:** specify and test the request pipeline before refactoring implementation.

Recommended lifecycle:

```text
input → build RequestContext → request transforms → request interceptors
      → transport attempt → parse response → response transforms → validation
      → response-success interceptors → result
      ↘ any failure → normalize ApiError → response-error interceptors → error
```

1. Introduce explicit public/internal contexts rather than overloading `RequestOptions`:
   - `RequestContext`: method, URL/baseURL, final URL, body, params, headers, options, attempt and metadata.
   - `ResponseContext<T>`: request context, native response, parsed data and timing/attempt metadata.
2. Decide whether interceptors may mutate context or must return a replacement; choose one and document it.
3. Make global and request-level transforms compose deterministically and define their order.
4. Wire logger/debug to the lifecycle or remove them from types/docs.
5. Add contract tests first: order, async handlers, ejection, successful response, HTTP error, network error and validation error.

**Acceptance:** tests prove every documented interceptor/transform path and docs use the same objects as code.

### Checkpoint 2 — Extract reliable transport

**Goal:** make behavior portable and testable without real network requests.

1. Separate Fetch transport from `ApiClient` orchestration; inject or select a transport adapter.
2. Add an XHR transport only in a browser-capable environment; use it for upload **and** download progress.
3. Implement timeout through composed abort signals; preserve caller cancellation versus timeout in the resulting error.
4. Handle empty successful bodies, JSON parse errors, binary/text response types and falsy bodies consistently.
5. Normalize headers case-insensitively and avoid setting multipart boundaries manually for `FormData`.

**Acceptance:** test matrix covers Fetch/browser-like behavior, unsupported XHR runtime, timeout, caller abort, 204, FormData, text/blob/arrayBuffer and progress selection.

### Checkpoint 3 — Retry and error policy

**Goal:** turn raw retry loops into safe, observable behavior.

1. Set conservative default retry eligibility: network errors, timeout, 408, 429 and 5xx; never automatically retry unsafe methods unless explicitly enabled/idempotency-keyed.
2. Add capped exponential backoff with jitter and respect `Retry-After` where appropriate.
3. Support `onRetry(context)` and stop retry delay promptly when cancelled.
4. Enrich `ApiError` with `cause`, request context, response metadata and attempt count while retaining ergonomic helpers such as `is5xx()`.
5. Use fake timers and mocked transport to test exact attempt counts and delays.

**Acceptance:** published table states what retries by default; retry tests cover all branches without external services.

### Checkpoint 4 — Zod contracts (optional package)

**Goal:** bridge static generics and real runtime data without bloating core.

1. Create `@api-zero/zod` only after Checkpoints 1–3 are stable.
2. Offer adapters/schema helpers for response, body and params validation.
3. Produce a distinct validation error that retains Zod issues and request/response context.
4. Keep existing `validateResponse` only if it has a clear migration/compatibility role.

**Acceptance:** a documented example validates params/body/response, infers types where practical, and shows a useful failure path.

### Checkpoint 5 — React and integrations

**Goal:** improve ergonomics without duplicating data-cache libraries.

1. Let `ApiProvider` accept a stable client instance as well as—or instead of—configuration; avoid recreation caused by object identity changes.
2. Add React tests for provider/hook error, stable identity and configuration behavior.
3. Design optional adapters/examples for TanStack Query and SWR. Do not create `useQuery` equivalents inside core React bindings.
4. Consider optional plugins/packages only after their extension contract is proven: auth refresh, telemetry and validation are strongest candidates.

**Acceptance:** official Next/Vite + TanStack Query example demonstrates cancellation, typed data and `ApiError` handling.

### Checkpoint 6 — Documentation, release and CI

**Goal:** publish only what is proven.

1. Rewrite docs against implemented API; remove every Better Call reference and dead link.
2. Keep Fumadocs source configuration, search, OG and LLM routes; add the React API references to its navigation metadata.
3. Add CI for format/lint, type check, unit tests, package build, docs build and external tarball installation smoke test.
4. Complete npm metadata, Changesets flow and a reproducible size measurement.
5. Fix non-blocking docs warnings when practical: install/resolve Shiki according to current Fumadocs/Next guidance and configure `metadataBase`.

**Acceptance:** clean installation of packed artifacts in a separate minimal Vite and Node fixture, docs build succeeds, release notes identify breaking changes.

## Testing strategy

Prefer deterministic unit tests with injected/mock transports over httpbin. The documentation demonstrates behaviour the same way, with a fake transport running the real policy on the page.

Minimum new suites:

- URL and query serialization, including per-request override.
- Header merge/removal and case normalization.
- Transform and interceptor ordering, async behavior and error propagation.
- Error normalization: HTTP, network, timeout, external abort, invalid JSON, empty body and validation.
- Retry eligibility, backoff/jitter, `Retry-After` and cancellation.
- Fetch vs XHR transport selection and progress behavior.
- React provider/hook behavior.
- Package consumer fixture using packed tarballs.

## Commands

```bash
pnpm test
pnpm build
pnpm --filter @api-zero/core test
pnpm --filter docs types:check
```

Run the relevant focused command during each checkpoint, then `pnpm test` before handing off. Do not alter or discard unrelated working-tree changes.

## First task for the next agent

Start with Checkpoint 1 only:

> Define the request/response/error lifecycle contract for `@api-zero/core`. Add context types and comprehensive contract tests for transforms and interceptors. Preserve existing public methods where feasible, make no Zod integration yet, and update only documentation directly affected by the finalized contract.

Before committing or broadening scope, report the chosen context shapes, execution order and any intended breaking changes.
