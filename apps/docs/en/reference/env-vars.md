---
title: Environment variables
status: in-progress
statusNote: existing variables are unvalidated and the planned ones don't exist yet
---

# Environment variables

<Status value="in-progress" />

The complete list. Validation is described at [Config & environment](/en/platform/config).

**Consumers:** 🐘 postgres · 🔴 redis · 🚦 traefik · ⚙️ api · 🌐 web · 📘 docs · 🐳 compose

## Already in `.env.example`

### Database

| Variable | Used by | Required | Default | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `POSTGRES_USER` | 🐘🐳 | ✅ | `app` | | Created when the container first starts |
| `POSTGRES_PASSWORD` | 🐘🐳 | ✅ | `app` | 🔒 | Change for anything beyond your laptop |
| `POSTGRES_DB` | 🐘🐳 | ✅ | `app_platform` | | |
| `POSTGRES_PORT` | 🐳 | | `5432` | | Host-published port |
| `DATABASE_URL` | ⚙️ | ✅ | `postgresql://app:app@postgres:5432/app_platform?schema=public` | 🔒 | **Host is `postgres`** — only resolves inside Docker. Running natively requires `localhost` |

### Redis

| Variable | Used by | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `REDIS_PORT` | 🐳 | | `6379` | |
| `REDIS_URL` | ⚙️ | | `redis://redis:6379` | **No code reads this yet** |

### API

| Variable | Used by | Required | Default | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `API_PORT` | ⚙️🐳 | | `4000` | | Read straight from `process.env` in `main.ts` |
| `JWT_ACCESS_SECRET` | ⚙️ | ✅ | — | 🔒 | ≥ 32 characters. Generate with `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | ⚙️ | ✅ | — | 🔒 | **Must differ from the access secret** |
| `JWT_ACCESS_EXPIRES_IN` | ⚙️ | | `15m` | | Keep it short — a leaked token expires fast |
| `JWT_REFRESH_EXPIRES_IN` | ⚙️ | | `7d` | | How long before a user must log in again |
| `LOG_LEVEL` | ⚙️ | | `info` (`.env.example` sets `debug`) | | `debug` only outside production — it contains queries |

::: danger The placeholder secrets must never be used
`.env.example` ships `JWT_ACCESS_SECRET=change-me-access-secret`, and `.env.example` and `.env` are byte-identical — so someone very likely copied the whole file. That's why [EnvSchema](/en/platform/config) refuses anything starting with `change-me`.
:::

### Web

| Variable | Used by | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `WEB_PORT` | 🐳 | | `3000` | |
| `NEXT_PUBLIC_API_URL` | 🌐 | ✅ | `http://api.localhost` | **Baked in at build and visible to browsers** — never put secrets here |

::: warning `NEXT_PUBLIC_*` is a build-time value
It's substituted as a literal during `next build`, not read at runtime, so changing it in production has no effect until you rebuild the image. Everyone who loads the site can read it — see [Config](/en/platform/config).
:::

### Docs & Traefik

| Variable | Used by | Default | Notes |
| --- | --- | --- | --- |
| `DOCS_PORT` | 📘🐳 | `5173` | Used by the `@app-platform/docs` `dev` script |
| `TRAEFIK_DASHBOARD_PORT` | 🚦🐳 | `8080` | The dashboard is insecure — development only |

### Set by compose itself

| Variable | Used by | Value | Why |
| --- | --- | --- | --- |
| `WATCHPACK_POLLING` | 🌐 | `true` | Next's watcher can't see changes across a bind mount without polling |
| `CHOKIDAR_USEPOLLING` | ⚙️ | `true` | Same, for ts-node-dev |
| `CI` | 🌐⚙️📘 | `true` | Disables interactive prompts inside containers |

## Planned but not present

<Status value="planned" inline />

### API runtime

| Variable | Required | Default | Secret | Notes | Page |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | | `development` | | `development` \| `test` \| `production` | [Config](/en/platform/config) |
| `CORS_ORIGINS` | ✅ | — | | Comma-separated allowlist, replacing the wide-open `enableCors()` | [Config](/en/platform/config) |
| `APP_WEB_URL` | ✅ | `http://app.localhost` | | Base for links in outgoing email | [Transactional email](/en/backend/email) |

### Google OAuth

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | when enabled | | From the Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | when enabled | 🔒 | |
| `GOOGLE_CALLBACK_URL` | when enabled | | Must match the registered URI exactly, e.g. `http://api.localhost/v1/auth/google/callback` |

Setting one requires setting all three — [EnvSchema](/en/platform/config) enforces this with a `refine`. See [Signup](/en/auth/signup).

### Email

| Variable | Required | Default | Secret | Notes |
| --- | --- | --- | --- | --- |
| `MAIL_TRANSPORT` | | `console` | | `smtp` \| `console` — `console` prints to the log instead of sending |
| `MAIL_FROM` | | `no-reply@app-platform.local` | | |
| `SMTP_URL` | when `MAIL_TRANSPORT=smtp` | — | 🔒 | e.g. `smtp://mailpit:1025` in development |
| `MAIL_VERIFY_TTL` | | `24h` | | Email verification token lifetime |
| `MAIL_RESET_TTL` | | `1h` | | Password reset token lifetime — deliberately shorter |

### Rate limiting

| Variable | Default | Notes |
| --- | --- | --- |
| `THROTTLE_TTL` | `60` | Window size in seconds |
| `THROTTLE_LIMIT` | `100` | Requests per window for normal endpoints |
| `THROTTLE_AUTH_LIMIT` | `5` | Login and forgot-password only — much stricter |

### Seeding

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `SEED_ADMIN_EMAIL` | ✅ when seeding | | The first administrator |
| `SEED_ADMIN_PASSWORD` | ✅ when seeding | 🔒 | Must be changed on first login |

### File storage

| Variable | Default | Notes |
| --- | --- | --- |
| `STORAGE_DRIVER` | `local` | `local` \| `s3` |
| `STORAGE_LOCAL_PATH` | `./uploads` | Used when the driver is `local` |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | — | Used when the driver is `s3` (the last two are secrets 🔒) |

## Adding a variable

1. Add it to `EnvSchema` (`apps/api/src/config/env.schema.ts`) — secrets get **no default**
2. Add it to `.env.example` with a comment
3. Add it to the service's `environment:` block in `docker-compose.yml`
4. Add a row to this page **and** the Thai version
5. Secrets → add to the production secret manager before deploying
6. Read it through `ConfigService` only

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| Everything passes through `EnvSchema` | No validation — just `ConfigModule.forRoot({ isGlobal: true })` |
| Read only via `ConfigService` | `main.ts` reads `process.env.API_PORT`; `app.module.ts` reads `LOG_LEVEL`/`NODE_ENV` |
| `CORS_ORIGINS` allowlist | Bare `enableCors()` allows every origin |
| `REDIS_URL` has a consumer | Set, but no code references it |
| `NEXT_PUBLIC_API_URL` has a consumer | Set, but no file in `apps/web` references it |
| `.env.example` differs from `.env` | The two files are byte-identical |
:::
