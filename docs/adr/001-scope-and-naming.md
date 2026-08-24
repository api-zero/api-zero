# ADR-001: Scope, Naming and Runtime Policy

**Date:** 2026-08-17
**Status:** Accepted — section 4 (Node.js rows) and the `engines` decision in section 7 are superseded by [ADR-002](002-supported-node-versions.md).
**Context:** api-zero needs formal decisions before behavioral changes begin.

## Decisions

### 1. Package Scope and Names

| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/core` | `@api-zero/core` | Client, transport, errors, interceptors, retries, params |
| `packages/react` | `@api-zero/react` | `ApiProvider`, `useApi` — React Context wrapper |
| `packages/zod` | `@api-zero/zod` | Optional Zod schema validation adapters (future) |

The monorepo is named `api-zero` (not `better-call-monorepo`).

### 2. Repository

- **URL:** `https://github.com/api-zero/api-zero`
- **Branch:** `main`

### 3. License

MIT — already present in `/LICENSE`.

### 4. Supported Runtimes

> **Superseded for Node.js by [ADR-002](002-supported-node-versions.md):** the floor is Node.js 22, not 18. The browser, Edge and Deno/Bun rows below still stand.

| Runtime | Support | Notes |
|---------|---------|-------|
| Browser (modern) | ✅ Full | Primary target. Fetch + XHR for progress. |
| Node.js 18+ | ✅ Full | Uses native `fetch` (available since Node 18). |
| Edge (Cloudflare Workers, Vercel Edge) | ✅ Fetch-only | No XHR. `btoa` available via `globalThis.btoa`. |
| Node.js < 18 | ❌ Not supported | No native `fetch`. |
| Deno / Bun | 🟡 Untested | Should work given Fetch API compatibility. |

**Key implications:**
- `btoa` is available in all supported runtimes (`globalThis.btoa`). No polyfill needed. Node 16+ has `btoa` in global scope, and we only target Node 18+.
- XHR is only used when `onUploadProgress` is provided. In non-browser runtimes, requesting upload progress should throw a clear error explaining XHR is unavailable.
- The `exports` field in `package.json` handles ESM/CJS. No separate browser/node entry points needed.

### 5. Zod Integration Strategy

Zod is the **first-class contract integration**, delivered as `@api-zero/zod`:
- **Separate package** — not a core dependency.
- Provides schema helpers for response, body, and params validation.
- Produces a distinct `ZodValidationError` that retains Zod issues and request/response context.
- Core provides the validation hook (`validateResponse`) that `@api-zero/zod` plugs into.
- Implementation deferred to Phase 5 (after lifecycle, transport, and retry are stable).

### 6. Debug / Logger Policy

**Decision: Remove from types until there's proven demand.**

- `debug` and `logger` fields are currently declared in `ApiClientConfig` but completely unused.
- Keeping dead fields in the public API creates a false promise to consumers.
- When demand arises (Phase 2+ or later), implement structured logging via an optional `onDebug(event)` callback pattern rather than injecting a logger instance.
- The interceptor system already provides a natural hook for request/response inspection.

### 7. Publish Configuration

- **Access:** Change from `"restricted"` to `"public"` in changeset config for open-source publication.
- **Files:** Each package publishes only `dist/` (plus `package.json`, `README.md`, `LICENSE`).
- **Side effects:** `"sideEffects": false` for tree-shaking.
- **Engines:** `"node": ">=22"` to document Node.js minimum — see [ADR-002](002-supported-node-versions.md).

### 8. Breaking Changes Policy

Given `v0.0.1` (pre-1.0), breaking changes are acceptable and expected:
- Document all breaking changes in changeset entries.
- Increment minor version for breaking changes until 1.0.
- Use `> [!WARNING]` blocks in release notes.
