---
title: API endpoint catalog
status: in-progress
statusNote: few real endpoints exist, there's no /v1 prefix, and POST /users has no guard
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
| `POST` | `/auth/login` | None | `LoginSchema` — `{ email, password }` | `AuthTokensSchema` — `{ accessToken, refreshToken }` | Throws `401` on wrong email/password (doesn't say which one) |
| `POST` | `/auth/refresh` | None (the refresh token itself is the credential) | `RefreshTokenSchema` — `{ refreshToken }` | `AuthTokensSchema` | Verifies and immediately re-signs — **no rotation**, the old token can be reused. See [JWT & refresh rotation](/en/auth/tokens) |

## Users

`UsersController` — mounted at `/users`

| Method | Path | Auth | Request body | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | **No guard at all** | `CreateUserSchema` — `{ email, displayName, password }` | `UserSchema` (no `passwordHash`) | Anyone can create an account right now — see [Roadmap item 1](/en/start/roadmap) and [Signup](/en/auth/signup) |
| `GET` | `/users/:id` | `JwtAuthGuard` + `@ApiBearerAuth()` | — | `UserSchema` (no `passwordHash`) | `404` if not found |

Both responses strip `passwordHash` via `toPublicUser()` in `UsersService` before returning.

## Health

`HealthController` — mounted at `/health`

| Method | Path | Auth | Request body | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health` | None | — | `{ status: "ok", checkedAt: <ISO datetime> }` | Decorated `@ApiExcludeController()` — **doesn't appear in Swagger UI**. A static liveness check; it doesn't actually probe the database or Redis |

## Auth requirement summary

| Guard | Applies to | Behavior |
| --- | --- | --- |
| None | `POST /auth/login`, `POST /auth/refresh`, `GET /health`, **`POST /users`** | All public — the first three intentionally, the last one not |
| `JwtAuthGuard` | `GET /users/:id` | Requires a valid `Authorization: Bearer <accessToken>`. Doesn't yet check [CASL/permissions](/en/auth/rbac-model) — only confirms someone is logged in, not that they may view *this* user |

## Spec'd but not yet real endpoints

Endpoints other pages describe that the controllers don't implement — don't assume these exist without checking the controller yourself:

- `POST /auth/logout` — revoke a single refresh token family ([JWT & refresh rotation](/en/auth/tokens))
- `POST /auth/google`, `GET /auth/google/callback` — Google OAuth ([Signup](/en/auth/signup))
- `POST /auth/verify-email`, `POST /auth/resend-verification` ([Email verification](/en/auth/email-verification))
- `POST /auth/forgot-password`, `POST /auth/reset-password` ([Forgot password](/en/auth/forgot-password))
- `GET /users`, `PATCH /users/:id`, `DELETE /users/:id` — the rest of users CRUD has no route yet

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| Every business route prefixed `/v1` | No prefix at all |
| `POST /users` behind an intentional signup flow (guarded or rate-limited) | 100% public |
| Refresh token rotation | `refresh()` just verifies and re-signs |
| Full CRUD on `/users` | Only create and single-record read exist |
| Paginated responses (`paginatedSchema()`) | No endpoint returns a list yet |
:::
