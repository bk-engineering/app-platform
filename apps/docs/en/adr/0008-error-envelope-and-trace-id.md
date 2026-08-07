---
title: 0008 · Error envelope + trace id
status: planned
---

# 0008 · Error envelope + trace id

<Status value="planned" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** cross-cutting

## Context

The API currently returns Nest's default error shape (`{ statusCode, message, error }`), where `message` is sometimes a string and sometimes an array depending on who threw it. Clients have to guess. And nothing connects the error a user sees to the server logs — when someone reports "it showed an error", there is no way to find out what happened.

## Decision

Two things that only work together.

**1. One error envelope.** Every error passes through a single `AllExceptionsFilter` and emerges as:

```ts
{ code, message, traceId, timestamp, path, details[] }
```

`code` comes from a [catalog](/en/reference/error-codes) and is treated as part of the API — its meaning cannot change.

**2. A trace id through every layer.** A UUIDv7 in `x-request-id`, held in `AsyncLocalStorage`, attached to every log line including Prisma queries, present in the envelope, and displayed in the UI with a copy button.

Details at [Error envelope](/en/conventions/errors) and [Trace ID](/en/platform/trace-id).

## Why one ADR covers both

Separately, each is only half useful. An envelope without a trace id lets clients handle errors but leaves us unable to find the logs. A trace id without an envelope gives us an id that never reaches the user. **The value appears when the user pastes a trace id and we find the logs instantly** — which requires both.

## Alternatives considered

### Keep Nest's default shape
Zero work, but the shape is inconsistent, there are no stable codes, and nothing links to logs.

### RFC 7807 (Problem Details)
A real standard with `type`, `title`, `status`, `detail`, `instance` — but `type` as a URI is overkill for a single system, and there's no place for the field-level errors we need to bind back to form inputs. Our shape follows the same idea, fitted to what we actually use.

### OpenTelemetry from the start
The correct destination, but it needs a collector, a backend, and full instrumentation — too much for a boilerplate. A plain `x-request-id` delivers 80% of the value for 5% of the effort, and can be upgraded to `traceparent` later without touching call sites.

### Pass the trace id as a function argument
Explicit and easy to follow, but it means adding a parameter to every function along the way. `AsyncLocalStorage` keeps unrelated code from having to know about tracing at all.

## Consequences

**We gain:** one client-side error handler for the whole system · `code` translates into the user's language · `details[]` maps straight back onto form fields · one grep goes from a user-visible error to the SQL that caused it · no internal detail escapes

**We give up:** an `AllExceptionsFilter`, a `TraceIdMiddleware`, and `AsyncLocalStorage` to maintain · **middleware ordering becomes critical** — the trace middleware must precede pino or every line reads `no-trace` · every error code must be catalogued and translated twice · a small `AsyncLocalStorage` overhead

**What must follow:** add `error.schema.ts` to contracts · write the filter and middleware · configure pino's `genReqId` and `redact` · add an `errors` namespace to `messages/{th,en}.json` · surface a copyable trace id in the UI

## When to revisit

When the system spans more than one service, or when integrating an APM. Move to W3C `traceparent` while still accepting `x-request-id`; because `getTraceId()` returns the same single value, nothing downstream changes.
