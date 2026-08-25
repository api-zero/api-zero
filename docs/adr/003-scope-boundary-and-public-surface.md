# ADR-003: Scope Boundary and Public Surface

**Date:** 2026-08-25
**Status:** Accepted
**Supersedes:** ADR-001 section 5 in part — the Zod integration ships one entry
point, not three.

## Context

api-zero exists to delete one specific file from every project: the hand-written
`api.ts` / `useApi.ts` wrapper that configures a client, stashes the auth token,
installs an interceptor and re-declares `.get` / `.post` helpers.

Review before the first release found the implementation had drifted past that
line in three ways.

### 1. The React package had grown a data-fetching library

`useRequest` auto-executed on mount, held a `idle | loading | success | error`
state machine, exposed `refetch`, `enabled` and `initialData`, and aborted the
previous in-flight request. That is `useQuery` without a cache.

`useMutation` went further: same name as TanStack Query's export, and the same
shape (`mutate`, `mutateAsync`, `reset`, `onSuccess`, `onError`, `onSettled`).
Any project using both had two `useMutation` competing for one import name.

The cost was not theoretical. `useRequest` did not refetch when `params`
changed, despite a comment claiming it did: the serialized-params value was
computed into an unused variable and never reached the effect's dependencies.
Pagination — the most basic thing asked of a fetching hook — silently did not
work, and no test covered it. Building a query library by accident means
inheriting its hard problems (reactive keys, deduplication, invalidation)
without having decided to solve them.

### 2. The Zod package offered three ways to do one thing

Standalone adapters (`zodResponse` / `zodBody` / `zodParams`), a wrapper client
(`createZodClient` / `ZodApiClient`) and contract objects (`defineContract` /
`ApiContract`) all expressed the same idea. Two parts were broken:

- `zodContract` accepted a `params` schema and typed its result as validated,
  but never wired it. Callers believed query parameters were checked; nothing
  checked them.
- `zodParams` returned `{ validateParams }`, a shape no part of the request
  pipeline consumes. `RequestOptions` has no such field. Its only caller was its
  own test.

`ZodApiClient` also hand-mirrored eight configuration methods from `ApiClient`,
a delegation layer guaranteed to fall behind every time core grows a method.

### 3. Core exported its own internals

`index.ts` re-exported roughly thirteen implementation helpers — `toBase64`,
`findHeaderKey`, `extractHeaders`, `parseResponseBody`, `prepareFetchBody`,
`createCompositeSignal`, `sleepWithSignal`, `parseRetryAfter`,
`calculateRetryDelay`, `isMethodRetryable`, `serializeParams`, `withRetry` and
the `CompositeSignal` type. Every one becomes a compatibility promise the moment
the package is published, freezing the transport internals against refactoring.

## Decisions

### 1. The boundary

api-zero owns transport and contracts: the request, retries, timeouts,
cancellation, structured errors and runtime-validated payloads.

TanStack Query and SWR own server state: cache, deduplication, invalidation,
background refresh and lifecycle. api-zero does not compete with them, does not
reimplement them, and is designed to sit underneath them.

Any future API that holds response state across renders is out of scope by
default and needs an ADR to enter.

### 2. `@api-zero/react` surface

`ApiProvider`, `useApi`, `ApiContext`. Nothing else.

`useRequest` and `useMutation` are removed. The documented pairing is
`useApi()` inside a TanStack Query `queryFn`, forwarding the `signal` TanStack
supplies so cancellation reaches the real request.

### 3. `@api-zero/zod` surface

One entry point: `createZodClient` / `withZod`, plus the `zodResponse`,
`zodBody` and `zodContract` adapters it is built from, and `ZodValidationError`.

`defineContract` / `ApiContract` and `zodParams` are removed. `zodContract` no
longer accepts a `params` schema, because core has no params-validation hook and
typing an unchecked value as checked is worse than not offering it.

`ZodApiClient` keeps only the schema-aware verbs and exposes the underlying
client as `.client`. It mirrors no configuration methods, so there is nothing to
keep in sync.

### 4. `@api-zero/core` surface

`ApiClient`, `createClient`, `ApiError`, `InterceptorManager`, the transport
contract (`Transport`, `TransportResponse`, `FetchTransport`, `XhrTransport`),
the context types and the config types.

Internal helpers are no longer exported. Removing a public export after release
is a breaking change; adding one is not. Ship the smallest surface that can be
defended.

## Consequences

- These removals are breaking, and deliberately land before the first publish,
  while the cost is zero.
- The documentation site still describes the removed APIs in prose. Package
  READMEs — the ones shipped inside the tarballs — are corrected here; the site
  is rewritten in a separate pass.
- A no-cache imperative call is `useApi()` plus `useState`. That is a few lines
  in the rare case, and it keeps the package from advertising itself as a
  half-built alternative to the libraries it is meant to complement.
