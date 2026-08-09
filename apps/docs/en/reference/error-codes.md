---
title: Error code catalog
status: in-progress
statusNote: the error envelope is real now, but only 6 codes from this catalog have an actual throw site
---

# Error code catalog

<Status value="in-progress" note="only part of this catalog has real throw sites — see the table at the bottom" />

Every `code` that can appear in an [error envelope](/en/conventions/errors) must be in this table. If it isn't, that's a bug.

::: danger Error codes are part of the API
Clients branch on `code`. Changing the meaning of an existing code is a breaking change, exactly like removing a field. If the meaning changes, add a new code — don't repurpose an old one.
:::

## Naming

```
<NAMESPACE>_<SUBJECT>
```

| Namespace | Covers |
| --- | --- |
| `AUTH_` | Authentication — who you are |
| `AUTHZ_` | Authorization — what you may do |
| `USER_` | The user domain |
| `ROLE_` | Roles and permissions |
| `FILE_` | Upload/download |
| `VALIDATION_` | Malformed input |
| `RESOURCE_` | Generic resource problems, no domain |
| `RATE_` | Rate limiting |
| `SYS_` | System failures |

Always UPPER_SNAKE_CASE, never numbered.

## Authentication

| Code | HTTP | i18n key | Thrown when | Client should |
| --- | --- | --- | --- | --- |
| `AUTH_INVALID_CREDENTIALS` | 401 | `errors.AUTH_INVALID_CREDENTIALS` | Wrong email or password | Show a form error — **never say which one** |
| `AUTH_TOKEN_MISSING` | 401 | `errors.AUTH_TOKEN_MISSING` | No Bearer token | Redirect to login |
| `AUTH_TOKEN_INVALID` | 401 | `errors.AUTH_TOKEN_INVALID` | Bad signature or malformed | Clear the session, go to login |
| `AUTH_TOKEN_EXPIRED` | 401 | `errors.AUTH_TOKEN_EXPIRED` | Access token expired | **Refresh and retry** |
| `AUTH_REFRESH_INVALID` | 401 | `errors.AUTH_REFRESH_INVALID` | Refresh token unknown/expired/revoked | Go to login |
| `AUTH_REFRESH_REUSED` | 401 | `errors.AUTH_REFRESH_REUSED` | An already-rotated token was presented — theft suspected | Go to login and say all sessions were revoked |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | `errors.AUTH_EMAIL_NOT_VERIFIED` | Email verification required | Go to "check your email" |
| `AUTH_ACCOUNT_INACTIVE` | 403 | `errors.AUTH_ACCOUNT_INACTIVE` | Account is deactivated | Tell them to contact an administrator |
| `AUTH_PASSWORD_NOT_SET` | 400 | `errors.AUTH_PASSWORD_NOT_SET` | Password login on a Google-only account | Point them at the Google button |
| `AUTH_OAUTH_FAILED` | 400 | `errors.AUTH_OAUTH_FAILED` | The Google flow failed | Return to login with a message |
| `AUTH_OAUTH_EMAIL_TAKEN` | 409 | `errors.AUTH_OAUTH_EMAIL_TAKEN` | The Google email matches an existing password account | Ask them to log in with a password, then link |

::: tip `AUTH_TOKEN_EXPIRED` must be distinct from `AUTH_TOKEN_INVALID`
They lead to different client behaviour — `EXPIRED` means refresh silently and retry; `INVALID` means discard and log in again. Collapse them into one and users get kicked out every 15 minutes.
:::

## Authorization

| Code | HTTP | i18n key | Thrown when | Client should |
| --- | --- | --- | --- | --- |
| `AUTHZ_FORBIDDEN` | 403 | `errors.AUTHZ_FORBIDDEN` | CASL denied, and the user already knows the resource exists | Show a permission message |
| `AUTHZ_INSUFFICIENT_ROLE` | 403 | `errors.AUTHZ_INSUFFICIENT_ROLE` | A higher role is required | Show a permission message |

::: tip When to answer 404 instead of 403
If confirming the resource exists is itself a leak, use `RESOURCE_NOT_FOUND` — see [API conventions](/en/conventions/api-conventions).
:::

## Users

| Code | HTTP | i18n key | Thrown when |
| --- | --- | --- | --- |
| `USER_NOT_FOUND` | 404 | `errors.USER_NOT_FOUND` | No such user id |
| `USER_EMAIL_TAKEN` | 409 | `errors.USER_EMAIL_TAKEN` | Email already in use |
| `USER_PASSWORD_MISMATCH` | 400 | `errors.USER_PASSWORD_MISMATCH` | Current password wrong during a change |
| `USER_PASSWORD_WEAK` | 422 | `errors.USER_PASSWORD_WEAK` | Fails the password policy |
| `USER_PASSWORD_REUSED` | 422 | `errors.USER_PASSWORD_REUSED` | New password equals the old one |
| `USER_CANNOT_DELETE_SELF` | 409 | `errors.USER_CANNOT_DELETE_SELF` | An admin deleting their own account |
| `USER_LAST_ADMIN` | 409 | `errors.USER_LAST_ADMIN` | Would leave the system with no administrator |

## Roles & permissions

| Code | HTTP | i18n key | Thrown when |
| --- | --- | --- | --- |
| `ROLE_NOT_FOUND` | 404 | `errors.ROLE_NOT_FOUND` | No such role |
| `ROLE_KEY_TAKEN` | 409 | `errors.ROLE_KEY_TAKEN` | Duplicate key |
| `ROLE_SYSTEM_IMMUTABLE` | 409 | `errors.ROLE_SYSTEM_IMMUTABLE` | Editing or deleting a system role (`isSystem`) |
| `ROLE_IN_USE` | 409 | `errors.ROLE_IN_USE` | Deleting a role that users still hold |

## Verification / reset tokens

| Code | HTTP | i18n key | Thrown when |
| --- | --- | --- | --- |
| `TOKEN_INVALID` | 400 | `errors.TOKEN_INVALID` | Unknown verification/reset token |
| `TOKEN_EXPIRED` | 400 | `errors.TOKEN_EXPIRED` | Past `expiresAt` |
| `TOKEN_ALREADY_USED` | 409 | `errors.TOKEN_ALREADY_USED` | `consumedAt` is already set |

## Files

| Code | HTTP | i18n key | Thrown when |
| --- | --- | --- | --- |
| `FILE_TOO_LARGE` | 413 | `errors.FILE_TOO_LARGE` | Over the size limit |
| `FILE_TYPE_UNSUPPORTED` | 415 | `errors.FILE_TYPE_UNSUPPORTED` | MIME type not on the allowlist |
| `FILE_UPLOAD_FAILED` | 500 | `errors.FILE_UPLOAD_FAILED` | Storage backend failure |

## Generic

| Code | HTTP | i18n key | Thrown when |
| --- | --- | --- | --- |
| `VALIDATION_FAILED` | 422 | `errors.VALIDATION_FAILED` | zod rejected the input — specifics in `details[]` |
| `RESOURCE_NOT_FOUND` | 404 | `errors.RESOURCE_NOT_FOUND` | Generic not-found, or hidden for permission reasons |
| `RESOURCE_CONFLICT` | 409 | `errors.RESOURCE_CONFLICT` | An unmapped Prisma `P2002` |
| `RATE_LIMIT_EXCEEDED` | 429 | `errors.RATE_LIMIT_EXCEEDED` | Throttled — accompanied by `Retry-After` |
| `SYS_DEPENDENCY_UNAVAILABLE` | 503 | `errors.SYS_DEPENDENCY_UNAVAILABLE` | Database or a dependency is down |
| `INTERNAL_ERROR` | 500 | `errors.INTERNAL_ERROR` | Anything unclassified |
| `NETWORK_ERROR` | — | `errors.NETWORK_ERROR` | **Client-generated** when the request never landed or the response wasn't an envelope |

## Validation codes inside `details[]`

`details[].code` uses its own namespace because it's bound to a field rather than the whole request. Map them from zod issue codes:

| zod issue | `details[].code` | Suggested English |
| --- | --- | --- |
| `invalid_type` | `validation.invalid_type` | Wrong type |
| `too_small` | `validation.too_small` | Too short or too small |
| `too_big` | `validation.too_big` | Too long or too large |
| `invalid_format` (email) | `validation.email` | Not a valid email address |
| `invalid_format` (uuid) | `validation.uuid` | Not a valid identifier |
| `invalid_enum_value` | `validation.enum` | Not an allowed value |
| `custom` | `validation.custom` | Invalid value |

## Adding a code

1. Ask whether an existing code fits — a bloated catalog is one nobody reads
2. Pick the right namespace
3. Add a row here **and** in the Thai version
4. Add a helper to `Errors` in `apps/api/src/common/errors/app.exception.ts`
5. Add keys to `apps/web/messages/th.json` **and** `en.json`
6. If the client needs special behaviour, write it in the "Client should" column

::: warning Current code status
The [error envelope](/en/conventions/errors) is real now, but the `Errors` helper (`apps/api/src/common/errors/app.exception.ts`) only covers the codes with an actual throw site today: `AUTH_INVALID_CREDENTIALS`, `AUTH_REFRESH_INVALID`, `AUTH_REFRESH_REUSED`, `USER_EMAIL_TAKEN`, `USER_NOT_FOUND`, `AUTHZ_FORBIDDEN` — plus `VALIDATION_FAILED`/`RESOURCE_CONFLICT`/`RESOURCE_NOT_FOUND`/`INTERNAL_ERROR`, which the filter classifies automatically. The rest of this table is spec waiting on endpoints that don't exist yet (signup, email verification, role management, file upload), per the "adding a new code" rule above — add one only once there's a real throw site.
:::
