# ADR-002: Supported Node.js Versions

**Date:** 2026-08-24
**Status:** Accepted
**Supersedes:** ADR-001 section 4 (Supported Runtimes), Node.js rows only, and the `engines` decision in ADR-001 section 7.

## Context

ADR-001 set the Node.js floor at 18 because that is the release where `fetch`
became available without a flag. That reasoning describes a capability, not a
support commitment, and the two had drifted apart by the time it was written.

The Node.js release schedule as of this date:

| Version | End of life | Status today |
|---------|-------------|--------------|
| 18 (Hydrogen) | 2025-04-30 | End of life for ~16 months |
| 20 (Iron) | 2026-04-30 | End of life for ~4 months |
| 22 (Jod) | 2027-04-30 | Supported |
| 24 (Krypton) | 2028-04-30 | Supported |
| 26 | 2029-04-30 | Current; becomes LTS on 2026-10-28 |

The CI matrix inherited from ADR-001 was `18.x, 20.x, 22.x`, so two thirds of it
exercised runtimes that no longer receive security patches, while `engines`
advertised a floor of `>=18` to consumers.

That combination also broke the build: `apps/docs` depends on `next@16`, which
requires Node `>=20.9.0`, so the Node 18 job failed on the first CI run and the
default fail-fast strategy cancelled the two jobs that mattered.

## Decisions

### 1. Supported Node.js versions

Node.js **22 and later**. Versions 18 and 20 are not supported.

| Runtime | Support | Notes |
|---------|---------|-------|
| Node.js 22+ | ✅ Full | Native `fetch`. Every version in the CI matrix. |
| Node.js < 22 | ❌ Not supported | End of life; not tested and not advertised. |

The browser, Edge and Deno/Bun rows of ADR-001 section 4 are unchanged.

### 2. Engines floor

`"engines": { "node": ">=22" }` in `@api-zero/core`, `@api-zero/react` and
`@api-zero/zod`.

The floor states what CI actually proves. Advertising support for a runtime that
no job exercises is a promise nothing backs.

### 3. CI matrix

`22.x`, `24.x`, `26.x`, with `fail-fast: false`.

- 22 is the lowest supported version, so it defines the floor.
- 24 is the current LTS.
- 26 is Current and becomes LTS on 2026-10-28. It is also the version used for
  local development, which would otherwise be the only untested runtime in the
  project.

`fail-fast: false` keeps one failing job from cancelling the others; the first
CI run reported a single failure and two cancellations, which hid whether the
supported runtimes passed.

### 4. Consequence for the docs build

No special casing is needed. Every version in the matrix satisfies the
`>=20.9.0` floor that `next@16` requires, so `pnpm build` runs unmodified
across the whole matrix.

## Notes

`fetch` availability starting in Node 18 remains true and is documented where it
is relevant. It is no longer the basis of the support policy.
