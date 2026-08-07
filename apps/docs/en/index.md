---
layout: home
hero:
  name: app-platform
  text: Single source of truth
  tagline: The full boilerplate spec — architecture, data contracts, auth, and guides. Code follows the docs, not the other way around.
  actions:
    - theme: brand
      text: What is this boilerplate
      link: /en/start/introduction
    - theme: alt
      text: Quickstart
      link: /en/start/quickstart
    - theme: alt
      text: Implementation status
      link: /en/start/roadmap
features:
  - title: Architecture
    details: System overview, containers, request lifecycle, and data model — with diagrams.
    link: /en/architecture/overview
  - title: Contract-first
    details: zod schemas in packages/contracts are the single source of truth for every request and response.
    link: /en/conventions/contract-first
  - title: Trace ID
    details: One id follows a request from the browser through the API into the database and every log line.
    link: /en/platform/trace-id
  - title: Auth & access
    details: JWT with refresh rotation, Google OAuth, RBAC, and CASL on both the server and the UI.
    link: /en/auth/overview
  - title: Error envelope
    details: One error shape across the whole system, backed by a stable error code catalog.
    link: /en/conventions/errors
  - title: ADRs
    details: Why it was built this way, and which alternatives were rejected.
    link: /en/adr/overview
---
