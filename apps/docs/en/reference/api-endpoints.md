---
title: API endpoint catalog
status: in-progress
statusNote: few real endpoints exist and there's no /v1 prefix — but guards/CASL/the error envelope are real on every endpoint that does exist
---

# API endpoint catalog

<Status value="in-progress" />

Every endpoint that actually exists in `apps/api` today — distinct from [API conventions](/en/conventions/api-conventions), which are the general rules. This page is the real, controller-verifiable list.

::: warning No `/v1` prefix exists in the code today
[API conventions](/en/conventions/api-conventions) requires every business route to start with `/v1`, but `app.setGlobalPrefix("v1")` is never called in `main.ts`. The paths below reflect what the code actually answers, not the spec.
:::

## Auth

`AuthController` — mounted at `/auth`

| Method | Path | Auth | Request body | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/token` | None (`@Public()`) | `application/x-www-form-urlencoded` per `TokenRequestSchema` — `grant_type=password` requires `username`+`password`, `grant_type=refresh_token` requires `refresh_token` (enforced by `.refine()`) | `TokenResponseSchema` — `{ access_token, token_type: "bearer", expires_in, refresh_token }` | A single endpoint combining login + refresh per the OAuth2 password/refresh_token grant (RFC 6749), so Swagger UI's **Authorize → OAuth2 (password)** can fetch and auto-attach the token itself. Throws `401 AUTH_INVALID_CREDENTIALS` on bad credentials, `422 VALIDATION_FAILED` if fields don't match the grant_type, `401 AUTH_REFRESH_INVALID`/`AUTH_REFRESH_REUSED` on a bad refresh token — **actually rotates** on every refresh with reuse detection. See [JWT & refresh rotation](/en/auth/tokens) |
| `GET` | `/auth/me` | Requires auth | — | `{ user: { id, email }, rules: RawRule[] }` | Returns the signed-in user's raw CASL ability rules. See [CASL](/en/auth/casl) |

## Users

`UsersController` — mounted at `/users`

| Method | Path | Auth | Request body | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | Requires auth + `@CheckPolicies(can('create','User'))` | `CreateUserSchema` — `{ email, displayName, password }` | `UserSchema` (no `passwordHash`) | Per the [permission matrix](/en/auth/rbac-model) only `manager`/`admin` can create — `403 AUTHZ_FORBIDDEN` otherwise, `409 USER_EMAIL_TAKEN` on a duplicate email |
| `GET` | `/users/:id` | Requires auth | — | `UserSchema` (no `passwordHash`) | Row-level check via `ability.can('read', subject('User', user))` — `member` only sees themselves; anyone else gets `404 USER_NOT_FOUND` (not `403`, so the id's existence isn't confirmed) |

Both responses strip `passwordHash` via `toPublicUser()` in `UsersService` before returning. Every failure from any endpoint returns the same [error envelope](/en/conventions/errors), always carrying a `code` and `traceId`.

## Health

`HealthController` — mounted at `/health`

| Method | Path | Auth | Request body | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health` | None | — | `{ status: "ok", checkedAt: <ISO datetime> }` | Decorated `@ApiExcludeController()` — **doesn't appear in Swagger UI**. A static liveness check; it doesn't actually probe the database or Redis |

## Auth requirement summary

| Guard | Applies to | Behavior |
| --- | --- | --- |
| `@Public()` (skips both guards) | `POST /auth/token`, `GET /health` | Intentionally public |
| `JwtAuthGuard` + `PoliciesGuard` (both global via `APP_GUARD`) | Every other route (`GET /auth/me`, `POST /users`, `GET /users/:id`) | Requires a valid `Authorization: Bearer <access_token>` (bearer scheme `access-token` or the oauth2 password flow), then a real [CASL/permission](/en/auth/rbac-model) check — not just "is someone logged in" |

## Spec'd but not yet real endpoints

Endpoints other pages describe that the controllers don't implement — don't assume these exist without checking the controller yourself:

- `POST /auth/logout`, `POST /auth/revoke` — revoke a single refresh token family ([JWT & refresh rotation](/en/auth/tokens)) — OAuth2 has a standard shape for this, `POST /auth/revoke` (RFC 7009), if we want to follow the spec fully
- `POST /auth/google`, `GET /auth/google/callback` — Google OAuth ([Signup](/en/auth/signup))
- `POST /auth/verify-email`, `POST /auth/resend-verification` ([Email verification](/en/auth/email-verification))
- `POST /auth/forgot-password`, `POST /auth/reset-password` ([Forgot password](/en/auth/forgot-password))
- `GET /users`, `PATCH /users/:id`, `DELETE /users/:id` — the rest of users CRUD has no route yet (so the field-level update permissions in [RBAC](/en/auth/rbac-model) can't be exercised by real code yet)

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| Every business route prefixed `/v1` | No prefix at all |
| `POST /users` behind an intentional guard | ✅ requires auth + `create User` permission (manager or above) |
| Refresh token rotation | ✅ actually rotates every time, with reuse detection |
| Every error is the same envelope | ✅ `AllExceptionsFilter` |
| Full CRUD on `/users` | Only create and single-record read exist |
| Paginated responses (`paginatedSchema()`) | No endpoint returns a list yet |
:::
