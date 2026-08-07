---
title: 0003 · Shared zod contracts
status: implemented
---

# 0003 · Shared zod contracts

<Status value="implemented" />

- **Status:** accepted
- **Date:** 2026-08-02
- **Category:** contracts

## Context

Request and response shapes are needed in three places — the Nest DTO, the React type, and the form's validation rules. Written separately, all three drift, and they drift silently until something fails at runtime.

## Decision

Define every contract as a **zod schema in `packages/contracts`, once**, and consume it from both apps.

- The API turns it into a DTO with nestjs-zod's `createZodDto()`, which Swagger can read
- The web app uses it as a react-hook-form resolver and `.parse()`s responses at the boundary
- Types come from `z.infer` — no duplicate interfaces

Usage details at [Contract-first](/en/conventions/contract-first).

## Alternatives considered

### class-validator + class-transformer (Nest's default)
Better documented and the recommended path, but class decorators can't meaningfully be shared with the frontend — the validation rules end up rewritten in react-hook-form anyway, which is the exact problem we're solving.

### tRPC
End-to-end type safety without a central schema, but it couples the client to the server too tightly — Swagger disappears, curl stops working, and non-TypeScript clients can't connect at all.

### Generate clients from OpenAPI
Makes the API the source of truth, but generated clients are typically hard to read, and you only get types, not client-side validation rules — so the form rules still get written twice.

### Share only TypeScript types
The lightest option, but types vanish at runtime — no help at exactly the boundary where external data arrives.

## Consequences

**We gain:** one definition yields types, DTOs, resolvers, and response validation · changing a schema makes `tsc` chase both sides until they agree · rules like bcrypt's `max(72)` are enforced on both sides for free

**We give up:** zod becomes a repo-wide commitment · `packages/contracts` must run in Node and the browser, so nothing platform-specific can live there · nestjs-zod is an extra dependency to keep aligned with Nest

**What must follow:** `apps/web` still doesn't import contracts despite declaring the dependency · `error.schema.ts` and `ability.schema.ts` need to be added

## When to revisit

When a non-TypeScript external client starts consuming the API. At that point the zod-generated OpenAPI document becomes the primary contract and versioning has to get much stricter.
