---
title: Status & roadmap
status: implemented
---

# Status & roadmap

<Status value="implemented" />

The aggregate status board. The docs are the target spec; this table says how far the code has come.

Badge meanings live at [Status legend](/en/reference/status-legend).

## By page

### Start & architecture

| Page | Status | Note |
| --- | --- | --- |
| [What is this boilerplate](/en/start/introduction) | <Status value="implemented" inline /> | |
| [Quickstart](/en/start/quickstart) | <Status value="implemented" inline /> | |
| [Repo tour](/en/start/repo-tour) | <Status value="implemented" inline /> | |
| [Glossary](/en/start/glossary) | <Status value="implemented" inline /> | |
| [System overview](/en/architecture/overview) | <Status value="implemented" inline /> | |
| [Containers & routing](/en/architecture/containers) | <Status value="implemented" inline /> | no production compose or Dockerfile yet |
| [Tech stack & rationale](/en/architecture/tech-stack) | <Status value="implemented" inline /> | |
| [Request lifecycle](/en/architecture/request-lifecycle) | <Status value="planned" inline /> | no interceptors or exception filter |
| [Data model](/en/architecture/data-model) | <Status value="planned" inline /> | schema has only `User` |

### Conventions & cross-cutting

| Page | Status | Note |
| --- | --- | --- |
| [Contract-first](/en/conventions/contract-first) | <Status value="in-progress" inline /> | api uses contracts; web does not |
| [API conventions](/en/conventions/api-conventions) | <Status value="in-progress" inline /> | no `/v1` prefix; `paginatedSchema` unused |
| [Error envelope](/en/conventions/errors) | <Status value="planned" inline /> | still Nest's default error shape |
| [Folder structure · api](/en/conventions/structure-api) | <Status value="in-progress" inline /> | only auth, users, prisma, health |
| [Folder structure · web](/en/conventions/structure-web) | <Status value="in-progress" inline /> | only one route |
| [Trace ID](/en/platform/trace-id) | <Status value="planned" inline /> | no `genReqId`, no AsyncLocalStorage |
| [Config & environment](/en/platform/config) | <Status value="planned" inline /> | `ConfigModule` has no `validate` |
| [Observability & logging](/en/platform/observability) | <Status value="in-progress" inline /> | pino wired up, not tied to trace id yet |
| [Health checks](/en/platform/health) | <Status value="in-progress" inline /> | `GET /health` is liveness-only, no DB/Redis check |
| [Security checklist](/en/platform/security) | <Status value="planned" inline /> | open CORS, no helmet, no rate limiting |

### Auth & access

| Page | Status | Note |
| --- | --- | --- |
| [Auth overview](/en/auth/overview) | <Status value="in-progress" inline /> | |
| [JWT & refresh rotation](/en/auth/tokens) | <Status value="in-progress" inline /> | tokens issued, but no rotation or revocation |
| [Login](/en/auth/login) | <Status value="in-progress" inline /> | endpoint exists · page does not |
| [Signup & Google OAuth](/en/auth/signup) | <Status value="planned" inline /> | `POST /users` exists but is **unguarded** · no OAuth |
| [Forgot password](/en/auth/forgot-password) | <Status value="planned" inline /> | |
| [Email verification](/en/auth/email-verification) | <Status value="planned" inline /> | |
| [Role & permission model](/en/auth/rbac-model) | <Status value="planned" inline /> | |
| [CASL authorization](/en/auth/casl) | <Status value="planned" inline /> | `@casl/*` not installed |
| [Client session](/en/frontend/auth-client) | <Status value="planned" inline /> | |
| [Permissions in the UI](/en/frontend/permissions-client) | <Status value="planned" inline /> | |
| [Transactional email](/en/backend/email) | <Status value="planned" inline /> | |

### Backend

| Page | Status | Note |
| --- | --- | --- |
| [Backend overview](/en/backend/overview) | <Status value="in-progress" inline /> | validation and Swagger are real |
| [Validation (zod pipe)](/en/backend/validation) | <Status value="implemented" inline /> | |
| [Prisma & data access](/en/backend/prisma) | <Status value="in-progress" inline /> | schema has only `User`, seed is broken |
| [OpenAPI / Swagger](/en/backend/openapi) | <Status value="implemented" inline /> | live at `api.localhost/docs` |
| [Caching (Redis)](/en/backend/caching) | <Status value="planned" inline /> | Redis runs, nothing uses it |
| [Background jobs & queues](/en/backend/jobs) | <Status value="planned" inline /> | no BullMQ or worker |
| [File storage](/en/backend/file-storage) | <Status value="planned" inline /> | no multer/S3 client |

### Frontend

| Page | Status | Note |
| --- | --- | --- |
| [Frontend overview](/en/frontend/overview) | <Status value="in-progress" inline /> | |
| [Data fetching (TanStack Query)](/en/frontend/data-fetching) | <Status value="in-progress" inline /> | provider exists, zero query hooks |
| [Forms (react-hook-form + zod)](/en/frontend/forms) | <Status value="planned" inline /> | libs installed, no form component |
| [UI system (shadcn/ui)](/en/frontend/ui-system) | <Status value="planned" inline /> | `button.tsx` isn't real shadcn |
| [i18n (next-intl)](/en/frontend/i18n) | <Status value="in-progress" inline /> | `defaultLocale` still `en`, contradicts ADR-0011 |
| [Theming & dark mode](/en/frontend/theming) | <Status value="planned" inline /> | no theme provider at all |
| [Client session](/en/frontend/auth-client) | <Status value="planned" inline /> | |
| [Permissions in the UI](/en/frontend/permissions-client) | <Status value="planned" inline /> | |

### Product features

| Page | Status | Note |
| --- | --- | --- |
| [Dashboard](/en/features/dashboard) | <Status value="planned" inline /> | no UI beyond the home page |
| [Settings · User management](/en/features/settings-users) | <Status value="planned" inline /> | only a public `POST /users` |
| [Settings · Roles & permissions](/en/features/settings-roles) | <Status value="planned" inline /> | no `Role`/`Permission` tables |
| [Settings · Theme](/en/features/settings-theme) | <Status value="planned" inline /> | no `User.theme` column |
| [Profile](/en/features/profile) | <Status value="planned" inline /> | no avatar upload, no Google linking |

### Quality

| Page | Status | Note |
| --- | --- | --- |
| [Testing strategy](/en/quality/testing) | <Status value="planned" inline /> | `vitest` installed, zero test files |
| [Lint, format & type-check](/en/quality/code-quality) | <Status value="in-progress" inline /> | eslint/prettier/husky work, no `typecheck` script |

### Operations & reference

| Page | Status | Note |
| --- | --- | --- |
| [Docker & Traefik](/en/ops/docker-traefik) | <Status value="in-progress" inline /> | dev stack is real, no production image |
| [CI/CD](/en/ops/ci-cd) | <Status value="planned" inline /> | no `.github/workflows` at all |
| [Deployment](/en/ops/deployment) | <Status value="planned" inline /> | no target platform chosen yet |
| [Database operations](/en/ops/database-ops) | <Status value="planned" inline /> | no backups, no `migrate deploy` in CI/CD |
| [API endpoint catalog](/en/reference/api-endpoints) | <Status value="in-progress" inline /> | few real endpoints, no `/v1` prefix |
| [Contract schema catalog](/en/reference/contracts) | <Status value="in-progress" inline /> | schemas match code, web doesn't use them yet |

## Known debt

Things we already know are wrong or contradict the spec, most urgent first.

| # | Issue | Where | Why it matters |
| --- | --- | --- | --- |
| 1 | `POST /users` is public and unguarded | `apps/api/src/users/users.controller.ts` | Anyone can create accounts. Close it or turn it into a deliberate signup flow — see [Signup](/en/auth/signup) |
| 2 | Bare `enableCors()` allows every origin | `apps/api/src/main.ts` | Must become an allowlist before production |
| 3 | Refresh tokens are reusable forever | `apps/api/src/auth/auth.service.ts` | Needs rotation + reuse detection — see [JWT & rotation](/en/auth/tokens) |
| 4 | Seeding fails via `prisma db seed` | `apps/api/prisma.config.ts` calls `tsx`, which isn't a dependency | Breaks Prisma's standard command |
| 5 | Env is never validated at boot | `apps/api/src/app.module.ts` | Misconfiguration explodes at runtime instead of failing to start — see [Config](/en/platform/config) |
| 6 | Web `defaultLocale` is `en` | `apps/web/src/i18n/routing.ts` | Contradicts [ADR-0011](/en/adr/0011-thai-default-locale) |
| 7 | Redis is provisioned but unused | `docker-compose.yml` | Decide what it's for (throttler store / refresh denylist) or remove it |
| 8 | No tests at all | whole repo | `vitest` is a devDependency and `turbo test` exists, but there are no test files |
| 9 | No CI | no `.github/` | Nothing stops a broken build from merging — see [CI/CD](/en/ops/ci-cd) |
| 10 | `button.tsx` is hand-written, not shadcn | `apps/web/src/components/ui/button.tsx` | No Radix, no `asChild`, uses an undefined `bg-brand-600` token — see [UI system](/en/frontend/ui-system) |
| 11 | No `typecheck` script anywhere | every `package.json` in the project | Type errors can slip through uncaught — see [Lint, format & type-check](/en/quality/code-quality) |
| 12 | No production Dockerfile/compose | `infra/docker/**`, root | Only the dev stack works today, nothing deployable — see [Docker & Traefik](/en/ops/docker-traefik) |

## Documentation scope

Phase 0–7 are fully written in both languages — every pillar of the boilerplate (frontend, backend, auth & access, product features, quality, operations) has a spec in these docs. What's left is code catching up to spec, not more docs to write — the table above is the gap between the two.
