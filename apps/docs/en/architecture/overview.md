---
title: System overview
status: implemented
---

# System overview

<Status value="implemented" />

One page for the whole mental model. Each part links to its own page for detail.

## Context

```mermaid
flowchart LR
  User(["User"])
  Admin(["Administrator"])
  Google["Google<br/>OAuth 2.0"]
  Mail["Email provider"]

  subgraph Platform["app-platform"]
    Web["apps/web<br/>Next.js"]
    Api["apps/api<br/>NestJS"]
    Docs["apps/docs<br/>VitePress"]
  end

  User -->|HTTPS| Web
  Admin -->|HTTPS| Web
  Web -->|REST + Bearer JWT| Api
  Api -.->|OIDC| Google
  Api -.->|SMTP / API| Mail
  Admin -->|reads the spec| Docs

  classDef ext fill:#f5f5f5,stroke:#999,stroke-dasharray:4 3
  class Google,Mail ext
```

Google OAuth and the email provider are dashed — not implemented yet ([Signup](/en/auth/signup), [Transactional email](/en/backend/email)).

## Components

```mermaid
flowchart TB
  Browser["Browser"]

  subgraph Edge["Traefik v3.7"]
    R1["app.localhost"]
    R2["api.localhost"]
    R3["docs.localhost"]
  end

  subgraph WebApp["apps/web · Next.js 16"]
    Proxy["proxy.ts<br/>i18n + route guard"]
    RSC["Server Components"]
    Client["Client Components<br/>TanStack Query"]
    ApiClient["core/api-client<br/>fetch + zod parse"]
  end

  subgraph ApiApp["apps/api · NestJS 11"]
    Pipeline["middleware → guard → pipe<br/>→ interceptor → controller"]
    Modules["auth · users · health"]
    Prisma["PrismaService"]
  end

  subgraph Data["Data layer"]
    PG[("PostgreSQL 18")]
    Redis[("Redis 8")]
  end

  Contracts["packages/contracts<br/>zod schemas"]

  Browser --> Edge
  R1 --> Proxy --> RSC --> Client --> ApiClient
  R2 --> Pipeline --> Modules --> Prisma --> PG
  ApiClient -->|Bearer JWT| R2
  Modules -.-> Redis
  R3 --> Docs["VitePress"]

  Contracts -.imports.-> ApiClient
  Contracts -.imports.-> Pipeline

  classDef unused fill:#fafafa,stroke:#bbb,stroke-dasharray:4 3
  class Redis unused
```

| Part | Responsibility | Detail |
| --- | --- | --- |
| **apps/web** | All UI, i18n, form validation, session storage | [Client session](/en/frontend/auth-client) |
| **apps/api** | Business rules, data access, token issuance, permission enforcement | [Auth overview](/en/auth/overview) |
| **apps/docs** | Spec and documentation (not in the runtime path) | — |
| **packages/contracts** | zod schemas for requests/responses — the contract between the two apps | [Contract-first](/en/conventions/contract-first) |
| **Traefik** | Reverse proxy mapping `*.localhost` to each service | [Containers & routing](/en/architecture/containers) |
| **PostgreSQL** | All persistent state, reached only through Prisma | [Data model](/en/architecture/data-model) |
| **Redis** | Provisioned, but no code uses it yet | [Roadmap](/en/start/roadmap) |

## Request path

An authenticated read passes through six hands.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant T as Traefik
  participant W as Next.js
  participant A as NestJS
  participant P as Prisma
  participant D as Postgres

  B->>T: GET /th/settings/users
  T->>W: route: app.localhost
  W->>W: proxy.ts — pick locale + check session
  W-->>B: HTML (RSC) + hydrate
  B->>T: GET /v1/users?page=1<br/>Authorization: Bearer …<br/>x-request-id: 0192…
  T->>A: route: api.localhost
  A->>A: guard (JWT) → guard (CASL) → zod pipe
  A->>P: prisma.user.findMany(accessibleBy(ability))
  P->>D: SELECT …
  D-->>P: rows
  P-->>A: models
  A-->>B: 200 + envelope<br/>x-request-id echoed back
```

Step-by-step detail, including the error path, is at [Request lifecycle](/en/architecture/request-lifecycle).

## Boundaries and rules

| Boundary | Rule |
| --- | --- |
| web ↔ api | REST + JSON only; never import code across |
| Shared code | Must live in `packages/contracts` and be a zod schema |
| Database access | Only through `PrismaService`; no raw SQL outside Prisma |
| Between API modules | Call exported services; never reach into another module's repository |
| Permissions | Always enforced server-side. The UI only hides things; it is not a guard. |
| Errors | Everything leaving the API uses the same envelope |
| Every request | Carries a trace id, and every log line carries it too |

Those last three are what make the system debuggable — read [Error envelope](/en/conventions/errors) and [Trace ID](/en/platform/trace-id).

## Why a modular monolith

One deployment, strictly separated modules. You get clear boundaries without carrying distributed transactions, service discovery, and cross-service debugging from day one. When a module genuinely outgrows the monolith, the boundaries you kept let you extract it without a rewrite.

Full reasoning and rejected alternatives: [ADR-0004](/en/adr/0004-modular-monolith).
