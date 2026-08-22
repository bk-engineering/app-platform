---
title: Security checklist
status: implemented
---

# Security checklist

<Status value="implemented" />

> **This isn't security theory. It's the list of things that must close before this boilerplate is ready for real traffic.**

## Layers of defense

```mermaid
flowchart TD
  R["Incoming request"] --> C{"CORS:<br/>is the origin allowed?"}
  C -->|No| C1["Blocked by the browser"]
  C -->|Yes| H["Security headers<br/>(helmet)"]
  H --> T{"Rate limit:<br/>over quota?"}
  T -->|Yes| T1["429 Too Many Requests"]
  T -->|No| G["Guards<br/>auth + CASL"]
  G --> V["Validation<br/>zod pipe"]
  V --> S["Service"]

  style C1 fill:#fee2e2,stroke:#dc2626
  style T1 fill:#fef9c3,stroke:#ca8a04
```

This page covers the first three layers (CORS, headers, rate limiting) — auth and CASL live at [Auth overview](/en/auth/overview) and [CASL](/en/auth/casl); backend validation has its own page.

## 1. CORS

### The real thing today

```ts
// apps/api/src/main.ts
app.enableCors({
  origin: env.CORS_ORIGINS, // from EnvSchema — an exact array of allowed origins
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["content-type", "authorization", "x-request-id"],
});
```

`CORS_ORIGINS` ties into [Config & environment](/en/platform/config) — the app fails to boot if it's unset in production. It must never default to `*` or `localhost`.

## 2. Security headers (helmet)

### The real thing today

```ts
// apps/api/src/main.ts
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", env.APP_WEB_URL],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
```

| Header | Protects against |
| --- | --- |
| `Content-Security-Policy` | XSS from unauthorized script/style sources |
| `X-Content-Type-Options: nosniff` | Browsers guessing the wrong MIME type and running foreign content as script |
| `Strict-Transport-Security` | Forces HTTPS after the first visit |
| `X-Frame-Options` / `frame-ancestors` | Clickjacking via iframe embedding |

::: tip An API with no HTML rendering still needs helmet
A common misconception is "APIs can't have XSS because they don't render HTML." But Swagger UI, Express's own error pages, or any endpoint that reflects user input back can still be exploitable. helmet's defaults are sensible and cost almost nothing to enable.
:::

## 3. Rate limiting

### The real thing today

```ts
// apps/api/src/app.module.ts
ThrottlerModule.forRoot([
  { name: "default", ttl: 60_000, limit: 100 }, // general: 100 req/min/IP
  { name: "auth", ttl: 60_000, limit: 5 },       // stricter for auth endpoints
]),
```

```ts
// apps/api/src/auth/auth.controller.ts
@Throttle({ auth: { limit: 5, ttl: 60_000 } })
@Public()
@Post("token")
token(@Body() body: TokenRequestDto) { … }
```

`POST /v1/users` isn't a public signup endpoint (it requires login plus `create User` permission — see [API conventions](/en/conventions/api-conventions)), so the `default` quota is enough for it — `forgot-password` in the table below is still a target because that endpoint itself is still planned ([Forgot password](/en/auth/forgot-password)).

| Endpoint | Recommended quota | Why |
| --- | --- | --- |
| `POST /v1/auth/login` | 5/min/IP | Stops password brute force |
| `POST /v1/auth/register` | 5/min/IP | Stops account-creation spam |
| `POST /v1/auth/forgot-password` | 3/min/IP + 3/hour/email | Stops flooding someone else's inbox with resets |
| Ordinary authenticated endpoints | 100/min/IP | Basic scraping/DoS protection |

::: warning Rate limiting needs the right key per endpoint
`forgot-password` needs limits both by IP (stops bots) **and** by target email (stops someone repeatedly triggering resets against another person's address as harassment). A single key isn't enough.
:::

## 4. Related topics that live on their own pages

This list doesn't repeat that content — it points at the page responsible for each.

| Topic | Lives at |
| --- | --- |
| bcrypt cost, password policy | [Signup](/en/auth/signup) |
| httpOnly cookies, token rotation | [JWT & refresh rotation](/en/auth/tokens) |
| Field-level authorization, self-escalation | [CASL](/en/auth/casl) |
| Never leaking stack traces to the client | [Error envelope](/en/conventions/errors) |
| No default secrets, build/runtime env split | [Config & environment](/en/platform/config) |
| Never logging sensitive data | [Observability & logging](/en/platform/observability) |

## CI that doesn't exist yet

There's no dependency scanning (`npm audit` / Snyk / Dependabot) wired to CI, because there's no CI at all yet — see [CI/CD](/en/ops/ci-cd). Once a pipeline exists, dependency scanning should run as its own job on every PR, not as an occasional manual check.

## Checklist

- [x] `enableCors()` restricts `origin` from `CORS_ORIGINS`
- [x] `helmet()` is enabled with a CSP that sets `defaultSrc`, `frameAncestors`
- [x] `ThrottlerModule` covers the whole app, with stricter limits on auth endpoints
- [ ] `forgot-password` is limited by both IP and target email
- [ ] Dependency scanning is in CI (once CI exists)
- [x] No secret in [`EnvSchema`](/en/platform/config) has a default

CORS restricts origins via `CORS_ORIGINS`, `helmet()` sets security headers, and `ThrottlerModule` covers the whole app with a stricter limit on `POST /v1/auth/token` — all three layers are done. Dependency scanning in CI is still missing because there's no CI at all yet — see [CI/CD](/en/ops/ci-cd).
