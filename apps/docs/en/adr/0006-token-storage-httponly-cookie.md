---
title: 0006 · Tokens in httpOnly cookies
status: planned
---

# 0006 · Tokens in httpOnly cookies

<Status value="planned" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** auth

## Context

The API returns tokens in the response body, and the web app has to decide where to keep them. That choice determines whether the system is exposed to XSS or to CSRF, and whether Server Components can fetch data on the user's behalf.

## Decision

**Both tokens live in httpOnly cookies, set by Next.js route handlers.**

- The browser posts to `/api/auth/*` (server-side route handlers), never to the API directly
- The route handler calls the API and converts the returned tokens into httpOnly `Set-Cookie` headers
- **Tokens never pass through page JavaScript**
- `refresh_token` uses `path=/api/auth/refresh` so it's only ever sent to that endpoint
- CSRF is handled with `SameSite=Lax` plus a double-submit token

## Alternatives considered

### `localStorage`
The simplest to write and immune to CSRF, but **one XSS means permanent token theft**, and every frontend dependency is a potential XSS vector. It's also unreadable from Server Components, which rules out server-side prefetching entirely.

### Access token in memory + refresh token in an httpOnly cookie
Safer than localStorage since the access token dies on reload, but every page load has to refresh before it can fetch anything, so there's always a blank moment — and Server Components still can't read the access token.

### httpOnly cookies set by the API directly
Removes the route-handler layer, but requires the API and web app to share a domain (or use the much weaker `SameSite=None`), and forces the API to know about the web client's specifics — at odds with an API meant to serve other clients too.

## Consequences

**We gain:** XSS can't exfiltrate tokens · Server Components can read cookies, enabling authenticated SSR and prefetching · the browser attaches cookies automatically · sessions survive reloads with no preliminary request

**We give up:** CSRF must be defended (SameSite + double-submit) · a Next route handler is needed for every auth endpoint · non-browser clients still need Bearer headers, so the strategy must accept both · slightly harder debugging, since tokens aren't visible in devtools

**What must follow:** build `/api/auth/{login,logout,refresh}` route handlers · add a CSRF token in `proxy.ts` · make `JwtStrategy` read the cookie first and fall back to the Bearer header

## When to revisit

When a native mobile app consumes the same API. Cookies suit that client poorly — give mobile Bearer tokens in OS secure storage while the web keeps cookies. Because the strategy already accepts both, nothing on the API needs to change.
