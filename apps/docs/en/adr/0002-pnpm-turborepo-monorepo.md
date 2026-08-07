---
title: 0002 · pnpm workspaces + Turborepo
status: implemented
---

# 0002 · pnpm workspaces + Turborepo

<Status value="implemented" />

- **Status:** accepted
- **Date:** 2026-08-02
- **Category:** monorepo

## Context

The web app, API, and docs need to share types and data contracts. Separate repositories produce the classic problem — change the API, then wait to publish a package, bump a version, and merge on the other side, while the two are out of sync and nothing catches it.

## Decision

**pnpm workspaces** for dependencies and **Turborepo** for running tasks.

- `pnpm-workspace.yaml` declares `apps/*` and `packages/*`
- Local packages link with `workspace:*` and always see real source
- `turbo.json` defines `dev`, `build`, `lint`, `test`, `clean` with dependency ordering

## Alternatives considered

### npm / yarn workspaces
Functionally similar, but hoisted `node_modules` lets you import undeclared dependencies with no warning (phantom dependencies) until a build fails elsewhere. pnpm's strict symlink layout only exposes what you declared.

### Nx
Far more capable — generators, a dependency graph, task orchestration — at the cost of significant configuration and tighter coupling. Turborepo delivers what we need (caching and ordering) in about 30 lines.

### Multiple repos with published packages
The cleanest boundaries, but far too much overhead for a team this size, and it makes atomic contract changes impossible — which directly conflicts with [ADR-0003](/en/adr/0003-shared-zod-contracts).

## Consequences

**We gain:** contract changes land in one commit across both apps · `pnpm build` catches mismatches immediately · Turbo's cache keeps CI from rebuilding everything · pnpm's store saves considerable disk space

**We give up:** `@app-platform/contracts` needs `transpilePackages` because it has no build step · pnpm 11 blocks postinstall by default, so `allowBuilds` must be declared explicitly · symlinked `node_modules` requires named volumes in Docker

**What must follow:** set up Turbo remote caching when CI arrives · add the missing `typecheck` task

## When to revisit

Once there are more than ~15 packages, or when a full build exceeds five minutes even with caching. At that point Nx's graph may justify its overhead.
