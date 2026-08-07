---
title: 0004 · Modular monolith over microservices
status: implemented
---

# 0004 · Modular monolith over microservices

<Status value="implemented" />

- **Status:** accepted
- **Date:** 2026-08-02
- **Category:** backend

## Context

This boilerplate is the starting point for a product whose direction isn't known yet. Small team, unknown load, and domain boundaries that haven't settled.

## Decision

**One NestJS deployment, split into strict modules.**

- One folder = one module = one bounded context (`auth`, `users`, …)
- Modules communicate only through exported services; never reach into another module's repository
- All modules share one Postgres instance, but **a module never touches another module's tables** through Prisma directly

## Alternatives considered

### Microservices from day one
Compiler-enforced boundaries and independent scaling, at the cost of service discovery, distributed transactions, cross-service debugging, internal API versioning, and much harder observability — all to solve problems we don't have yet.

More importantly: getting service boundaries wrong is far more expensive to fix than getting module boundaries wrong, and when the domain is still unfamiliar, getting them wrong is likely.

### An unstructured monolith
Fastest in the short term, but once the code grows nobody can tell what belongs to what, and extracting anything later becomes a full rewrite.

### Serverless functions
Scales well with no servers to run, but cold starts hurt latency, database connections need a pooler, and local development is considerably worse than Docker Compose.

## Consequences

**We gain:** one place to deploy and one place to debug · real database transactions across domains · boundaries can be refactored by moving files, not renegotiating service contracts · very simple local tooling

**We give up:** no independent scaling · a heavy module affects the whole process · boundaries are enforced by discipline and review rather than by the compiler

**What must follow:** add an eslint rule forbidding cross-module imports except through a module's `index.ts`, so the boundaries are tool-enforced

## When to revisit

When one module develops a clearly different resource profile from the rest — say, CPU-heavy file processing that hurts API latency. At that point extract *that one module*, not the whole system. The boundaries you maintained are what make that possible without a rewrite.
