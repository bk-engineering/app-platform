---
title: 0005 · JWT + refresh rotation
status: planned
---

# 0005 · JWT + refresh rotation

<Status value="planned" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** auth

## Context

The current code issues both access and refresh tokens as JWTs, with `refresh()` simply verifying and re-signing. The result: **a leaked refresh token works for its full seven days.** It can't be revoked, logout isn't real, and changing a password doesn't end sessions.

## Decision

**Short-lived JWT access tokens plus stateful, rotating opaque refresh tokens.**

- Access token: a 15-minute JWT carrying `sub`, `email`, `roles`, `jti`, `issuer`, `audience` — verified statelessly
- Refresh token: 256 random bits (not a JWT), stored as SHA-256 in a `RefreshToken` table
- Every successful refresh marks the old token used and issues a new one in the same `familyId`
- **Presenting an already-rotated token revokes the entire family** and notifies the user by email

Details at [JWT & refresh rotation](/en/auth/tokens).

## Alternatives considered

### Pure stateless JWTs (what exists today)
Fastest, never touches the database — but nothing can be revoked, which makes logout theatre and means a password reset doesn't evict whoever stole the session. Not acceptable.

### Fully server-side sessions (opaque token + Redis)
Easiest to revoke, but every request hits the store, making the API permanently dependent on Redis and paying that latency every time.

### Stateful refresh tokens without rotation
Revocable, but theft can't be *detected*. An attacker who copies a token and uses it alongside the owner produces no signal at all until a human notices.

### Rotation with reuse detection (chosen)
Keeps JWT speed on the hot path (every API call) while getting revocation and detection on the cold path (every 15 minutes), for a manageable amount of complexity.

## Consequences

**We gain:** logout actually works · password changes end every session · token theft is detected automatically · users can view and revoke sessions per device

**We give up:** `refresh_tokens` grows and needs sweeping · refresh must run in a transaction · **the client is now required to implement single-flight**, or concurrent requests trigger reuse detection and eject the user · reuse detection can false-positive on bad networks

**What must follow:** create the `RefreshToken` table · write `RefreshTokenService` · separate `AUTH_TOKEN_EXPIRED` from `AUTH_TOKEN_INVALID` in the guard · implement client-side single-flight ([Client session](/en/frontend/auth-client)) · add a cleanup job

## When to revisit

If reuse-detection false positives hurt users often (visible as an unusually high `AUTH_REFRESH_REUSED` rate), consider a short grace window where the previous token remains valid for a few seconds after rotation. That reduces detection power, so weigh it against real data.
