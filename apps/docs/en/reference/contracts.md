---
title: Contract schema catalog
status: in-progress
statusNote: the schemas that exist match the code, but only the api side uses them, and some schemas other pages reference don't exist yet
---

# Contract schema catalog

<Status value="in-progress" note="everything below is real, but web doesn't import it yet and some files are missing" />

Every schema actually exported from `packages/contracts/src` today — how to use them and the rules for changing one live at [Contract-first](/en/conventions/contract-first). This page is just a catalog, verifiable against the source.

## `index.ts` — the barrel

```ts
export * from "./common.schema";
export * from "./user.schema";
export * from "./auth.schema";
```

Everything imported from `@app-platform/contracts` comes from these three files.

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

## Who actually uses these

| Side | How |
| --- | --- |
| `apps/api` | Every DTO on `AuthController`/`UsersController` extends `createZodDto(<Schema>)` from `nestjs-zod` — see `apps/api/src/auth/dto/login.dto.ts` and `apps/api/src/users/dto/create-user.dto.ts` |
| `apps/web` | **Doesn't import any of these yet** — web forms aren't validated with the shared zod schemas. See [Contract-first § How web uses it](/en/conventions/contract-first) for the target pattern |

## Schemas other specs reference that don't exist here yet

- `ErrorEnvelopeSchema`, `ErrorDetailSchema` — spec'd at [Error envelope](/en/conventions/errors), but `error.schema.ts` hasn't been created in `packages/contracts/src`
- The CASL ability schema/type — described in [CASL authorization](/en/auth/casl) as `packages/contracts/src/ability.schema.ts`, but that file doesn't exist yet

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `error.schema.ts` for the error envelope | File doesn't exist |
| `ability.schema.ts` for CASL | File doesn't exist |
| web imports and uses these schemas for form validation | No import from `@app-platform/contracts` anywhere in `apps/web` |
| `paginatedSchema()` used by at least one real endpoint | No endpoint returns a paginated list yet |
:::
