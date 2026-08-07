---
title: 0015 · Docs as a bilingual SSOT
status: implemented
---

# 0015 · Docs as a bilingual SSOT

<Status value="implemented" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** process

## Context

`apps/docs` held four pages describing only what the code already did, while the boilerplate we actually intend to build — auth, permissions, trace ids, error envelopes — was undocumented. Letting docs trail the code means those specs live in one person's head and evaporate over time.

## Decision

**`apps/docs` is a spec-first single source of truth, always in two languages.**

1. **Docs lead the code** — pages describe the target boilerplate; the code follows the docs, not the reverse
2. **Every page carries a status** — `implemented` / `in-progress` / `planned`, in frontmatter and as a badge under the H1. See [Status legend](/en/reference/status-legend)
3. **Any page whose spec differs from the code carries a side-by-side box citing real files**
4. **Thai at the root, English under `/en/`, with identical path structure**
5. **`ignoreDeadLinks: false`** — a page that exists in only one language breaks `pnpm build`
6. **Sidebar and nav come from a single `.vitepress/structure.ts`**, so the two languages cannot drift structurally

## Alternatives considered

### Docs that follow the code
Always accurate, never lies — but there's nowhere to put specs that aren't built yet, which is exactly what the team needs most right now.

### Specs in issues or a task tracker
Tied to work and clearly owned, but issues get closed and disappear, and searching back through them is painful. Docs persist and live beside the code.

### Generate docs from code (OpenAPI, TypeDoc)
Accurate and never stale, but it only ever answers "what", never "why", and it cannot describe a flow that has no code. Useful as a supplement (Swagger stays) but not a replacement.

### One language
Half the work, but it contradicts [ADR-0011](/en/adr/0011-thai-default-locale), which established Thai as the product's primary language.

### Bilingual but not enforced
More flexible in theory; in practice it means the English side stays permanently half-finished. Failing the build is the only mechanism that actually works.

## Consequences

**We gain:** every spec lives in one readable place · docs work directly as implementation briefs · status badges make it obvious how far to trust a page · the two languages can't drift, because the build enforces it

**We give up:** every page is written twice · docs can lie if statuses aren't maintained — which is why **a PR that changes behaviour must change the docs too** · `ignoreDeadLinks: false` breaks the build the moment a mirror is forgotten (intended, but painful at first) · local search needs a Thai tokenizer

**What must follow:** add a docs build step to CI once CI exists · consider generating the [Roadmap](/en/start/roadmap) from frontmatter with `transformPageData` once there are more than 30 pages

## When to revisit

If maintaining two languages becomes costly enough that nobody wants to touch the docs. Documentation nobody updates because it feels like too much work is worse than single-language documentation that stays alive.
