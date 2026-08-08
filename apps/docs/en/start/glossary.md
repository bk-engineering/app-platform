---
title: Glossary
status: implemented
---

# Glossary

<Status value="implemented" />

Terms used repeatedly across this documentation set, grouped by topic. If a word looks unfamiliar on some page, come back here first.

## Architecture & cross-cutting

**SSOT (Single Source of Truth)**
This documentation set itself — the one place that defines how the system should behave. Code follows the docs, not the other way around. See [ADR-0015](/en/adr/0015-docs-as-bilingual-ssot).

**modular monolith**
Deployed as a single unit, but the code is split into modules with clear boundaries, like microservices. Gets boundary clarity without carrying distributed transactions from day one. See [System overview](/en/architecture/overview).

**contract**
A zod schema in `packages/contracts` that both `apps/web` and `apps/api` import. It's the agreement on what data crossing REST looks like. See [Contract-first](/en/conventions/contract-first).

**envelope**
The single shape every error coming out of the API must have (`code`, `message`, `traceId`, `timestamp`, `path`, `details[]`). Lets clients write one error handler for the whole system. See [Error envelope](/en/conventions/errors).

**trace id**
A single id per request (UUIDv7 format) that appears in every log line related to that request, from the browser all the way to the SQL query. See [Trace ID](/en/platform/trace-id).

**idempotency**
The property that calling something repeatedly produces the same result. `GET`/`PUT`/`DELETE` should be idempotent by nature; a `POST` with a serious side effect (e.g. one that would duplicate on retry) should accept an `idempotency-key` header. See [API conventions](/en/conventions/api-conventions).

**rate limiting**
Capping how many times an endpoint can be called in a time window, to guard against brute-force and abuse. Responds with `429` and code `RATE_LIMIT_EXCEEDED` when exceeded. See [Error code catalog](/en/reference/error-codes).

**presigned URL**
A URL with a built-in signature and expiry, letting a client upload or download a file directly against storage (e.g. S3) without the server acting as a relay.

**cache-aside**
A caching pattern where the app checks the cache first, falls back to the database on a miss, then writes the result back into the cache — unlike write-through, the cache isn't kept in lockstep with the database on every write.

## Authentication & authorization

**rotation**
The rule that a refresh token can only be used once — every successful use marks the old token as spent and issues a new one in its place. See [JWT & refresh rotation](/en/auth/tokens).

**reuse detection**
The mechanism that catches an already-rotated refresh token being used again — a signal the token leaked to an attacker. The system revokes every token in that family immediately. See [JWT & refresh rotation](/en/auth/tokens).

**RBAC (Role-Based Access Control)**
A permission model where permissions attach to roles, and users hold roles, rather than permissions attaching to users directly. The data layer lives at [Role & permission model](/en/auth/rbac-model); CASL is the mechanism that enforces it.

**ability**
The object CASL builds from one user's permissions. It answers three kinds of questions: "can this be done" (`can`), "which rows are visible" (`accessibleBy`), and "what rules should the UI know about". See [CASL authorization](/en/auth/casl).

**CASL**
The library used to implement authorization — turns permission rows in the database into an `ability`, then checks it on both the server (the real enforcement) and the UI (hiding buttons) from the same rule set. See [CASL authorization](/en/auth/casl).

## Docs & process

**status badge**
The <Status value="implemented" inline /> / <Status value="in-progress" inline /> / <Status value="planned" inline /> label every page must carry, showing how closely the content matches today's code. See [Status legend](/en/reference/status-legend).

**ADR (Architecture Decision Record)**
A record of an architectural decision, its reasoning, and the alternatives it rejected. Lives under the `adr/` section. Once merged, a file is never edited — a change of mind means writing a new ADR that supersedes the old one.
