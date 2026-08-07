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
| [Quickstart](/en/start/quickstart) | <Status value="in-progress" inline /> | seed fails via `prisma db seed` (tsx/ts-node mismatch) |
| [Repo tour](/en/start/repo-tour) | <Status value="implemented" inline /> | |
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
| [Trace ID](/en/platform/trace-id) | <Status value="planned" inline /> | no `genReqId`, no AsyncLocalStorage |
| [Config & environment](/en/platform/config) | <Status value="planned" inline /> | `ConfigModule` has no `validate` |

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
| 9 | No CI | no `.github/` | Nothing stops a broken build from merging |
| 10 | `button.tsx` is hand-written, not shadcn | `apps/web/src/components/ui/button.tsx` | No Radix, no `asChild`, uses an undefined `bg-brand-600` token |

## Not yet documented

This round covers everything through auth & access. Still to come:

- Canonical folder structure for both apps; backend (validation, Prisma, OpenAPI, caching, jobs, file storage)
- Frontend (data fetching, forms, UI system, i18n, theming)
- Product surfaces (dashboard, user management, role editor, theme settings, profile)
- Observability, health checks, security checklist
- Testing strategy, CI/CD, deployment, database operations
