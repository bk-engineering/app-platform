---
title: 0007 · CASL for authorization
status: planned
---

# 0007 · CASL for authorization

<Status value="planned" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** auth

## Context

The system currently has authentication only — sign in and you can do everything (`GET /users/:id` returns any user to any authenticated caller). We need role-based permissions with row-level rules ("only your own") and field-level rules ("a manager may edit a user but not their roles"), and the same logic must drive both server enforcement and UI visibility.

## Decision

Use **`@casl/ability` + `@casl/prisma`** as the system's single authorization engine.

- Rules are rows in a `Permission` table whose shape maps 1:1 onto CASL's `RawRule`
- `AbilityFactory.forUser()` builds an ability from the user's roles, substituting `${user.id}` in conditions
- `PoliciesGuard` enforces at the endpoint level
- `accessibleBy(ability)` is composed into the `where` of every Prisma query
- `GET /v1/auth/me` ships `ability.rules` to the UI, which rebuilds it with `createMongoAbility`

Details at [CASL](/en/auth/casl).

## Alternatives considered

### Direct role checks (`if (user.role !== "admin")`)
No dependencies, but it collapses the moment "their own" appears — conditions nest until they're unreadable, and hiding UI requires reimplementing the same logic in client TypeScript, where the two then drift apart.

### Hand-rolled Nest guards and decorators
Full control, no new dependency, but you end up writing a worse CASL — and you don't get `accessibleBy`, which translates rules into SQL. That's the hardest and most important part.

### Open Policy Agent / Cedar
Very powerful and cleanly separates policy from application, but requires running a service or embedding WASM, learning a policy language, and — critically — **cannot translate policy into database `WHERE` clauses**, which is precisely what we need most. It suits organisations with many services, not one modular monolith.

### Postgres row-level security via Prisma
Enforced at the database, so it can't be bypassed — but policies are SQL, unusable in the UI, hard to test, and require passing user context through connection session variables, which interacts badly with connection pooling.

## Consequences

**We gain:** one permission implementation shared by server and UI · `accessibleBy` filters in SQL rather than in memory · rules are data, so a permission-editing screen becomes possible · abilities are pure logic and trivially testable

**We give up:** `conditions` is JSON from the database fed into a permission evaluator — **it must always be validated with zod** · forgetting `accessibleBy` on one query is a leak tests won't catch · `forUser()` hits the database per request unless cached, and permission caches are unforgiving · the team must learn the action/subject/conditions model

**What must follow:** install `@casl/ability`, `@casl/prisma`, `@casl/react` · create the `Permission` and `Role` tables · write `AbilityFactory` and `PoliciesGuard` · **consider a Prisma client extension that injects `accessibleBy` automatically** so it can't be forgotten · test every row of the permission matrix, especially the denials

## When to revisit

When the system becomes multi-tenant. Every rule then needs a `tenantId` condition, and that must be enforced by tooling rather than memory — do it with a Prisma extension that scopes by tenant at the lowest layer, instead of relying on CASL alone.
