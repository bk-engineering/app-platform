---
title: Request lifecycle
status: planned
statusNote: the Nest pipeline only has ZodValidationPipe and JwtAuthGuard
---

# Request lifecycle

<Status value="planned" />

Follow one request from click to pixel, on both the happy and the failure path. This is where [contracts](/en/conventions/contract-first), the [error envelope](/en/conventions/errors), and the [trace id](/en/platform/trace-id) meet.

## Happy path

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant PX as proxy.ts
  participant RSC as Server Component
  participant Q as TanStack Query
  participant AC as api-client
  participant T as Traefik
  participant MW as TraceIdMiddleware
  participant G1 as JwtAuthGuard
  participant G2 as PoliciesGuard
  participant PP as ZodValidationPipe
  participant CT as Controller
  participant SV as Service
  participant PR as Prisma
  participant DB as Postgres

  B->>PX: GET /th/settings/users
  PX->>PX: resolve locale + check session cookie
  PX->>RSC: pass through
  RSC-->>B: HTML + RSC payload
  B->>Q: hydrated, useQuery(["users",{page:1}])
  Q->>AC: queryFn
  AC->>AC: traceId = uuidv7()
  AC->>T: GET /v1/users?page=1<br/>authorization: Bearer …<br/>x-request-id: 0192f8…
  T->>MW: route api.localhost
  MW->>MW: store traceId in AsyncLocalStorage<br/>set response header
  MW->>G1: continue
  G1->>G1: verify JWT → req.user, setUserId()
  G1->>G2: pass
  G2->>G2: build ability from user
  G2->>PP: allow
  PP->>PP: ListUsersQuerySchema.parse(query)
  PP->>CT: validated, typed query
  CT->>SV: list(query, ability)
  SV->>PR: findMany(where AND accessibleBy) + count
  PR->>DB: SELECT … LIMIT 20
  DB-->>PR: rows
  PR-->>SV: models
  SV-->>CT: { items, total, page, limit }
  CT-->>AC: 200 + JSON<br/>x-request-id echoed
  AC->>AC: UserPageSchema.parse(body)
  AC-->>Q: typed data
  Q-->>B: render the table
```

### What each hop does

| # | Hop | Responsibility | If it fails |
| --- | --- | --- | --- |
| 1 | `proxy.ts` | Resolve locale, redirect if no session | Redirect to `/th/login` |
| 2 | Server Component | Compose the page, optionally prefetch | Next error boundary |
| 3 | `api-client` | Attach trace id and token, parse the response | Throws `ApiError` |
| 4 | Traefik | Host-based routing | Traefik's own 404 (no envelope) |
| 5 | `TraceIdMiddleware` | Create or adopt the trace id | — |
| 6 | `JwtAuthGuard` | Authentication | `401 AUTH_TOKEN_INVALID` |
| 7 | `PoliciesGuard` | Authorization | `403 AUTHZ_FORBIDDEN` |
| 8 | `ZodValidationPipe` | Validate query/body | `422 VALIDATION_FAILED` |
| 9 | Controller | Translate HTTP into a service call | — |
| 10 | Service | Business rules | `AppException` with a code |
| 11 | Prisma | Data access | Mapped to 409/404/500 |
| 12 | `api-client` (`.parse`) | Verify the API kept its contract | Throwing here means the contract was broken |

::: tip Order matters: guards run before pipes
Nest always runs guards before pipes, so an unauthorised request is rejected before any CPU is spent validating the body — and error messages never leak what a valid body would look like.
:::

## Failure path

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant AC as api-client
  participant MW as TraceIdMiddleware
  participant CT as Controller
  participant SV as Service
  participant PR as Prisma
  participant EF as AllExceptionsFilter
  participant LG as pino

  B->>AC: submit create-user form
  AC->>MW: POST /v1/users<br/>x-request-id: 0192f8…
  MW->>CT: traceId already in the store
  CT->>SV: create(dto)
  SV->>PR: user.create(…)
  PR--xSV: P2002 unique violation
  SV--xEF: exception propagates
  EF->>EF: classify → 409 RESOURCE_CONFLICT
  EF->>LG: warn { traceId, code, path }
  EF-->>AC: 409 + envelope
  AC->>AC: toApiError(body, 409)
  AC--xB: throws ApiError
  B->>B: onError → setError("email")<br/>+ toast with traceId
```

**The key point:** every failure path, wherever it originates, funnels through a single `AllExceptionsFilter`. That's what guarantees one error shape and a trace id every time.

## Refresh path

A request that hits `401` is retried after a successful refresh, invisibly to the user.

```mermaid
sequenceDiagram
  autonumber
  participant C1 as query A
  participant C2 as query B
  participant AC as api-client
  participant API as API

  par two queries in flight
    C1->>AC: GET /v1/users
  and
    C2->>AC: GET /v1/roles
  end
  AC->>API: both with an expired access token
  API-->>AC: 401 AUTH_TOKEN_EXPIRED (×2)

  Note over AC: single-flight — refresh exactly once<br/>the second awaits the same promise
  AC->>API: POST /v1/auth/refresh
  API-->>AC: new token pair (rotated)
  AC->>API: retry /v1/users
  AC->>API: retry /v1/roles
  API-->>AC: 200 for both
  AC-->>C1: data
  AC-->>C2: data
```

Without single-flight, two simultaneously expired requests fire two refreshes. With [rotation](/en/auth/tokens), the second one presents an already-rotated token, the system reads that as reuse, and the whole family gets revoked — logging the user straight out. Details at [Client session](/en/frontend/auth-client).

## The Nest pipeline

Nest's order is fixed. Knowing it tells you where each kind of logic belongs.

```mermaid
flowchart LR
  R["request"] --> MW["Middleware<br/>TraceIdMiddleware"]
  MW --> GD["Guards<br/>JwtAuthGuard → PoliciesGuard"]
  GD --> IN1["Interceptor (before)<br/>start timer"]
  IN1 --> PP["Pipes<br/>ZodValidationPipe"]
  PP --> CT["Controller → Service"]
  CT --> IN2["Interceptor (after)<br/>log duration"]
  IN2 --> RS["response"]

  GD -.throw.-> EF["ExceptionFilter"]
  PP -.throw.-> EF
  CT -.throw.-> EF
  EF --> RS

  style EF fill:#fee2e2,stroke:#dc2626
  style MW fill:#dcfce7,stroke:#16a34a
```

| Layer | Put here | Never here |
| --- | --- | --- |
| Middleware | Trace id, security headers, anything that must run first | Business rules |
| Guard | Authentication, authorization, rate limiting | Data transformation |
| Interceptor | Timing, caching, logging | Access decisions |
| Pipe | Validation and type coercion | Database calls |
| Controller | HTTP ↔ service translation | Business rules |
| Service | All business rules | Knowledge of HTTP |
| Filter | Turning exceptions into envelopes | Business recovery |

::: danger Services must not know about HTTP
A service must never import `Request`, `Response`, or `HttpStatus` directly. Throw an `AppException` carrying a code and let the filter map it to a status. That keeps services reusable from background jobs and CLIs.

The single exception is the `Errors.*` helper, which pins `HttpStatus` at construction time — centralised in one file rather than scattered through services.
:::

::: warning Current code status
| Layer | Code today |
| --- | --- |
| Middleware | none at all |
| Guards | `JwtAuthGuard` exists but is opt-in per route; no `PoliciesGuard` |
| Interceptors | none |
| Pipes | global `ZodValidationPipe` ✅ |
| Filters | none — Nest's default error handler |
| Client side | no `api-client`, no refresh interceptor; `providers.tsx` has a bare `QueryClient` |
:::
