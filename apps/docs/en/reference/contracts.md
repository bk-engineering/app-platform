---
title: Contract schema catalog
status: in-progress
statusNote: the schemas that exist match the code, including error.schema.ts and ability.schema.ts now — but only the api side uses any of them
---

# Contract schema catalog

<Status value="in-progress" note="all 5 files are real now, but web doesn't import any of it yet" />

Every schema actually exported from `packages/contracts/src` today — how to use them and the rules for changing one live at [Contract-first](/en/conventions/contract-first). This page is just a catalog, verifiable against the source.

## `index.ts` — the barrel

```ts
export * from "./common.schema";
export * from "./user.schema";
export * from "./auth.schema";
export * from "./error.schema";
export * from "./ability.schema";
```

Everything imported from `@app-platform/contracts` comes from these five files.

## `common.schema.ts`

| Name | Kind | Shape |
| --- | --- | --- |
| `PaginationQuerySchema` | schema | `{ page: number (≥1, default 1), limit: number (1–100, default 20) }` — both fields use `z.coerce.number()` to auto-convert query strings |
| `PaginationQuery` | type | `z.infer<typeof PaginationQuerySchema>` |
| `paginatedSchema(itemSchema)` | schema factory | Returns `z.object({ items: T[], total: number, page: number, limit: number })` — takes an item schema as its argument |

```ts
const PaginatedUserSchema = paginatedSchema(UserSchema);
// { items: User[], total: number, page: number, limit: number }
```

::: tip `paginatedSchema()` has no callers yet
See the table at the bottom — it's a ready-to-use utility, but no controller returns a paginated list yet.
:::

## `user.schema.ts`

| Name | Kind | Shape |
| --- | --- | --- |
| `UserSchema` | schema | `{ id: uuid, email: email, displayName: string (1–120), createdAt: ISO datetime }` — **no** `passwordHash`, this is the shape sent to clients |
| `User` | type | `z.infer<typeof UserSchema>` |
| `CreateUserSchema` | schema | `{ email: email, displayName: string (1–120), password: string (8–72) }` |
| `CreateUser` | type | `z.infer<typeof CreateUserSchema>` |
| `UpdateUserSchema` | schema | `CreateUserSchema.pick({ displayName: true }).partial()` — i.e. `{ displayName?: string (1–120) }` |
| `UpdateUser` | type | `z.infer<typeof UpdateUserSchema>` |

`UpdateUserSchema` composes from `CreateUserSchema` instead of repeating fields — see [Contract-first § Composing schemas](/en/conventions/contract-first) for the pattern.

::: warning `UpdateUserSchema` has no endpoint yet
There's no `PATCH /users/:id` in `UsersController` today — the schema exists but the route hasn't been written. See [API endpoint catalog](/en/reference/api-endpoints).
:::

## `auth.schema.ts`

| Name | Kind | Shape |
| --- | --- | --- |
| `TokenRequestSchema` | schema | `{ grant_type: "password" \| "refresh_token", username?: email, password?: string (8–72), refresh_token?: string }` plus a `.refine()` requiring `username`+`password` when `grant_type=password`, and `refresh_token` when `grant_type=refresh_token` — per the OAuth2 password/refresh_token grant (RFC 6749) |
| `TokenRequest` | type | `z.infer<typeof TokenRequestSchema>` — fields unused by a given grant_type stay optional in the type, since `.refine()` doesn't narrow the union; call sites need a non-null assertion (`!`) after validation has already run |
| `TokenResponseSchema` | schema | `{ access_token: string, token_type: "bearer", expires_in: number, refresh_token: string }` — shaped per RFC 6749 §5.1, not the old camelCase `accessToken`/`refreshToken` |
| `TokenResponse` | type | `z.infer<typeof TokenResponseSchema>` |

::: tip Why this replaced `LoginSchema`/`AuthTokensSchema`
`/auth/login` and `/auth/refresh` used to be two separate endpoints with their own free-form camelCase JSON, matching no particular spec. They're now one `POST /auth/token` following the OAuth2 grant flow, so Swagger UI's **Authorize → oauth2 (password)** button can fetch tokens for you (see [OpenAPI / Swagger](/en/backend/openapi)) — the trade-off is the body must be `application/x-www-form-urlencoded` with RFC-named fields instead of camelCase.
:::

## `error.schema.ts`

| Name | Kind | Shape |
| --- | --- | --- |
| `ErrorDetailSchema` | schema | `{ field: string \| null, code: string, message: string }` |
| `ErrorDetail` | type | `z.infer<typeof ErrorDetailSchema>` |
| `ErrorEnvelopeSchema` | schema | `{ code: string, message: string, traceId: string, timestamp: ISO datetime, path: string, details: ErrorDetail[] (default []) }` |
| `ErrorEnvelope` | type | `z.infer<typeof ErrorEnvelopeSchema>` |

Matches the spec at [Error envelope](/en/conventions/errors) field for field — `AllExceptionsFilter` really builds this object for every error response.

## `ability.schema.ts`

| Name | Kind | Shape |
| --- | --- | --- |
| `ACTIONS` | const array | `["manage", "create", "read", "update", "delete"]` |
| `SUBJECTS` | const array | `["all", "User", "Role", "Permission", "AuditLog", "File"]` |
| `AppAction` / `AppSubject` | type | union of the values in `ACTIONS`/`SUBJECTS` |
| `RawRuleSchema` | schema | `{ action, subject, fields?: string[], conditions?: Record<string, ...>, inverted?: boolean, reason?: string }` — `conditions` allows only `$eq`/`$ne`/`$in`/`$nin` via `.strict()` |
| `RawRule` | type | `z.infer<typeof RawRuleSchema>` |
| `AbilityRulesSchema` | schema | `z.array(RawRuleSchema)` — the shape of the `rules` array `GET /auth/me` returns |

## Who actually uses these

| Side | How |
| --- | --- |
| `apps/api` | Every DTO on `AuthController`/`UsersController` extends `createZodDto(<Schema>)` from `nestjs-zod` — see `apps/api/src/auth/dto/token-request.dto.ts` and `apps/api/src/users/dto/create-user.dto.ts`. `AllExceptionsFilter` builds an `ErrorEnvelope` for every error, and `AbilityFactory` runs `AbilityRulesSchema.parse(...)` every time it builds an ability |
| `apps/web` | **Doesn't import any of these yet** — web forms aren't validated with the shared zod schemas. See [Contract-first § How web uses it](/en/conventions/contract-first) for the target pattern |

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `error.schema.ts` for the error envelope | ✅ |
| `ability.schema.ts` for CASL | ✅ |
| web imports and uses these schemas for form validation | No import from `@app-platform/contracts` anywhere in `apps/web` |
| `paginatedSchema()` used by at least one real endpoint | No endpoint returns a paginated list yet |
:::
