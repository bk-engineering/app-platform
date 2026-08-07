---
title: 0001 · Record architecture decisions
status: implemented
---

# 0001 · Record architecture decisions

<Status value="implemented" />

- **Status:** accepted
- **Date:** 2026-08-02
- **Category:** process

## Context

We need to record architectural decisions made in this project so future contributors understand the "why", not just the "what".

## Decision

We use Architecture Decision Records, stored as markdown files in `apps/docs/adr/`, numbered sequentially.

## Consequences

- Every significant architectural decision (framework choice, infra topology, cross-cutting pattern) gets its own ADR.
- ADRs are immutable once accepted; superseding decisions get a new ADR that references the old one.
- Like every other page, ADRs exist in both Thai and English per [ADR-0015](/en/adr/0015-docs-as-bilingual-ssot).

See [ADR index](/en/adr/overview) for the template and process.
