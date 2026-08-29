# ADR-004: Versioning and Release

**Date:** 2026-08-25
**Status:** Accepted

## Context

Three packages are published from one repository, and nothing had been released
yet. Changesets was configured by the scaffold but never exercised, so the
defaults had not been tested against this workspace.

## Decisions

### 1. Fixed (lockstep) versioning

`fixed: [["@api-zero/*"]]`. The three packages always publish under the same
version number.

Independent versions would be more precise, but they create a compatibility
matrix — "does react 0.3 work with core 0.2?" — that has to be documented and
maintained. With three packages that move together and an API still in motion,
that cost buys nothing. Lockstep answers the question by construction: the
matching version always works.

This is reversible in one config line once the packages stabilise at different
rates.

### 2. Start at 0.1.0, not 1.0.0

Under SemVer, `0.x` lets the minor act as a major: `0.1.0 → 0.2.0` may break.
That is the correct promise while the API is still settling. `1.0.0` is a
stability commitment this project is not ready to make.

### 3. `@api-zero/core` stays a peer dependency of react and zod

It is not merely conventional here, it is required. `ZodValidationError extends
ApiError`, `@api-zero/core` is externalised from both bundles, and both the
library and user code branch on `instanceof ApiError`. If a consumer ended up
with two copies of core, `instanceof` would silently return `false` and error
handling would fail in a way that is very hard to trace.

### 4. Peer range is `>=0.0.1`, not `workspace:*`

Changesets bumps any package whose peer dependency changes to **major**, unless
`onlyUpdatePeerDependentsWhenOutOfRange` is set *and* the new version satisfies
the declared range. The satisfaction check is plain semver, so:

| Declared range | Result for a 0.1.0 core |
| --- | --- |
| `workspace:*` | major — not a parseable semver range |
| `workspace:^` | major — same |
| `^0.0.1` | major — caret on `0.0.x` pins the patch, so 0.1.0 is out of range |
| `>=0.0.1` | minor — satisfied |

Left unconfigured, the first release would have published **1.0.0** instead of
0.1.0.

The range must also hold *before* the version bump lands, because the packed
tarballs still carry the pre-release version: a range of `>=0.1.0` alongside a
0.0.1 core makes `npm install` fail with ERESOLVE, which the consumer smoke
check caught. The range is deliberately permissive because lockstep releases
guarantee consumers receive matching versions anyway; it should be tightened to
`^1.0.0` when the packages reach 1.0.

### 5. Private apps are ignored

`ignore: ["docs"]`. It is not published, and versioning it adds
noise to every release.

### 6. Release flow

`changesets/action` on pushes to `main`:

1. Changesets pending → the action opens or updates a "Version Packages" pull
   request containing the version bumps and the generated CHANGELOG entries.
2. That PR merges → the action publishes to npm, creates the git tags and the
   GitHub Releases.

The release therefore passes through an explicit review step instead of firing
on every push. Release notes come from the summary written into each changeset
at the time of the change, rendered through `@changesets/changelog-github` so
entries link back to their pull request and author.

`npm provenance` is enabled (`id-token: write` plus `NPM_CONFIG_PROVENANCE`),
which publishes a verifiable link between each artifact and the workflow run
that produced it. If it ever blocks a publish, removing the env var and the
permission is enough to fall back.

The root `version` script was renamed to `version:packages`: `version` collides
with the npm lifecycle hook of the same name.

## Operational prerequisite

Publishing requires an npm organisation named `api-zero` and an Automation
token stored as the `NPM_TOKEN` repository secret. Until that secret exists the
workflow can still open version PRs, but the publish step fails.
