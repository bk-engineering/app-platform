---
title: ADR index
status: implemented
---

# ADR index

<Status value="implemented" />

An Architecture Decision Record captures **why** a decision was made, not just what it was. The most valuable part is "rejected alternatives" — because in six months someone will ask why we didn't do it that way.

## The records

| # | Title | Status | Date | Category |
| --- | --- | --- | --- | --- |
| [0001](/en/adr/0001-record-architecture-decisions) | Record decisions as ADRs | accepted | 2026-08-02 | process |
| [0002](/en/adr/0002-pnpm-turborepo-monorepo) | pnpm workspaces + Turborepo | accepted | 2026-08-02 | monorepo |
| [0003](/en/adr/0003-shared-zod-contracts) | Shared zod contracts | accepted | 2026-08-02 | contracts |
| [0004](/en/adr/0004-modular-monolith) | Modular monolith over microservices | accepted | 2026-08-02 | backend |
| [0005](/en/adr/0005-jwt-refresh-rotation) | JWT + refresh rotation | accepted | 2026-08-07 | auth |
| [0006](/en/adr/0006-token-storage-httponly-cookie) | Tokens in httpOnly cookies | accepted | 2026-08-07 | auth |
| [0007](/en/adr/0007-casl-authorization) | CASL for authorization | accepted | 2026-08-07 | auth |
| [0008](/en/adr/0008-error-envelope-and-trace-id) | Error envelope + trace id | accepted | 2026-08-07 | cross-cutting |
| [0011](/en/adr/0011-thai-default-locale) | Thai as the default locale | accepted | 2026-08-07 | i18n |
| [0015](/en/adr/0015-docs-as-bilingual-ssot) | Docs as a bilingual SSOT | accepted | 2026-08-07 | process |

::: tip Gaps in the numbering are fine
0009, 0010, and 0012–0014 are reserved for decisions coming in the next phase (Prisma, Tailwind, logging, Redis, testing). Numbers don't need to be contiguous — they only need to never be reused.
:::

## Statuses

| Status | Meaning |
| --- | --- |
| `proposed` | Suggested, not agreed |
| `accepted` | Agreed and in force |
| `superseded by ADR-XXXX` | Replaced; still readable for the original context |
| `deprecated` | No longer applies, with nothing replacing it |

::: danger Accepted ADRs are never edited
Changed your mind? Write a new ADR that supersedes the old one and update the old one's status to point at it. An ADR is a historical record, not a living document — all of its value comes from being able to read back what was believed and known at the time.
:::

Fixing typos or broken links is fine. What's forbidden is editing the substance of the decision.

## Template

```md
---
title: <short title>
status: planned
---

# NNNN · <title>

- **Status:** proposed | accepted | superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Category:** monorepo | backend | frontend | auth | cross-cutting | process

## Context

What the situation was, what constrained it, what was known and *not* known.

## Decision

What was chosen, stated affirmatively ("We will…").

## Alternatives considered

### Option A — <name>
Upsides · downsides · why not

### Option B — <name>
Upsides · downsides · why not

## Consequences

**What we gain** · **what we give up** · **what must follow**

## When to revisit

What signal would mean this decision should be reconsidered.
```

## When to write one

**Write one** when the decision is hard to reverse, spans multiple workspaces, picks between comparably viable options, or contradicts what people would reasonably expect.

**Don't** when the choice is obvious, confined to a single file, or a matter of taste a linter can settle.

If you're unsure, ask: *"will someone ask why we did this in six months?"* If yes, write it.
