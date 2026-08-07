---
title: Tech stack & rationale
status: implemented
---

# Tech stack & rationale

<Status value="implemented" />

Every row answers one question: **why this one.** To change any of it, write a new ADR that supersedes the old.

## Monorepo

| Piece | Version | Why |
| --- | --- | --- |
| pnpm workspaces | 11.18.0 | Content-addressable store saves disk; strict `node_modules` prevents phantom dependencies; `workspace:*` links local packages directly |
| Turborepo | ^2.10 | Content-hash task caching plus dependency ordering — one file change doesn't rebuild the repo |
| TypeScript | ^5.9 | Strict everywhere, from one `packages/config/tsconfig.base.json` |

→ [ADR-0002](/en/adr/0002-pnpm-turborepo-monorepo)

## Frontend

| Piece | Version | Why |
| --- | --- | --- |
| Next.js | ^16.2 | App Router + React Server Components cut shipped JS; `output: standalone` keeps images small; middleware (`proxy.ts`) does i18n and route guarding at the edge |
| React | ^19.2 | Required by Next 16 |
| TanStack Query | ^5.101 | Handles **server state** only — caching, dedupe, refetch, invalidation. Server data never gets mixed into a global store |
| next-intl | ^4.13 | Locale-in-path i18n that understands the App Router, usable in both server and client components |
| Tailwind CSS | ^4.3 | v4 is CSS-first — tokens live in `@theme` inside `packages/config/tailwind/theme.css`, no `tailwind.config.ts` |
| shadcn/ui | — | Components are copied into the repo, not installed. Edit freely without waiting on upstream |
| react-hook-form + `@hookform/resolvers` | ^7.84 / ^5.7 | Uncontrolled forms mean fewer re-renders; `zodResolver` lets forms reuse the exact schema the API validates against |
| zod | ^4.4 | One validation language for both frontend and backend |
| lucide-react | ^1.28 | shadcn's standard icon set |

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| A real shadcn component set | Only a hand-written `button.tsx`; Radix isn't a dependency; it uses a `bg-brand-600` token that `globals.css` never defines |
| Forms on react-hook-form + zodResolver | Both installed, zero usage — no form exists |
:::

## Backend

| Piece | Version | Why |
| --- | --- | --- |
| NestJS | ^11.1 | DI plus a module structure that enforces boundaries; pipes/guards/interceptors/filters keep cross-cutting concerns (validation, auth, tracing, errors) in one place instead of scattered |
| nestjs-zod | ^5.5 | `createZodDto()` turns a zod schema into a Swagger-readable DTO — the same contract the frontend uses, instead of duplicating it with class-validator |
| Prisma | ^7.9 | Schema is the source of truth, migrations are versioned, the client is type-safe, and `@casl/prisma` builds on it for row-level filtering |
| `@prisma/adapter-pg` | ^7.9 | Driver adapter talking straight to `pg`, no query-engine binary needed |
| PostgreSQL | 18-alpine | Relational, JSONB, good indexes — the safe default |
| nestjs-pino + pino-http | ^4.6 / ^11 | Very fast JSON logging, and `genReqId` is the hook [trace id](/en/platform/trace-id) needs |
| `@nestjs/swagger` | ^11.4 | OpenAPI generated from code at `/docs` |
| `@nestjs/jwt` + passport-jwt | ^11 / ^4 | Stateless JWT with a strategy that plugs into Nest guards |
| bcryptjs | ^3.0 | Password hashing with no native bindings — no cross-platform trouble in Docker |

## Not added yet, but required

| Piece | For | Page |
| --- | --- | --- |
| `@casl/ability` + `@casl/prisma` | Authorization with one ability set for server and UI | [CASL](/en/auth/casl) |
| `@nestjs/throttler` | Rate limiting login and email-sending endpoints | [Login](/en/auth/login) |
| `helmet` | Security headers | [Roadmap](/en/start/roadmap) |
| `@nestjs/terminus` | Readiness probes that actually check db/redis | [Roadmap](/en/start/roadmap) |
| An email provider + Mailpit | Forgot password / email verification | [Transactional email](/en/backend/email) |
| `next-themes` | Theme switching without a flash | [Roadmap](/en/start/roadmap) |
| Radix UI primitives | The base of the shadcn component set | [Roadmap](/en/start/roadmap) |

## Rejected alternatives

| Instead of | We chose | Because |
| --- | --- | --- |
| class-validator + class-transformer | zod via nestjs-zod | class-validator can't be shared with the frontend, so the rules get written twice and inevitably drift |
| tRPC | REST + zod contracts | REST keeps Swagger, other clients, and plain curl working; type safety already comes from contracts |
| NextAuth / Auth.js | JWT issued by our own API | The API must own identity so other clients can use it; NextAuth couples too tightly to Next |
| TypeORM / Drizzle | Prisma | Better migration workflow, and `@casl/prisma` gives row-level authorization for free |
| Redux / Zustand for server data | TanStack Query | Server data isn't client state; putting it in a store means hand-writing a cache, badly |
| Microservices | Modular monolith | See [ADR-0004](/en/adr/0004-modular-monolith) |
| Kong / nginx | Traefik | Auto-discovers services from Docker labels; far less config for development |
| Docusaurus / Nextra | VitePress | Fast, local search built in, straightforward i18n, and a working mermaid plugin |
