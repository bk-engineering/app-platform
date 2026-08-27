# app-platform

Monorepo: Next.js web app, NestJS API, VitePress docs, and a shared zod contracts package — run locally with Docker Compose and live-reload on file edits (no rebuild).

## Structure

```
apps/
  web/        Next.js (App Router, TanStack Query, shadcn/ui, Tailwind v4, next-intl)
  api/        NestJS (Swagger, JWT auth, Prisma/Postgres, pino logging)
  docs/       VitePress (architecture, ADRs, guides)
packages/
  contracts/  zod schemas shared by web + api (no build step, imported as TS source)
  config/     shared tsconfig, eslint, prettier, tailwind theme
infra/docker/ Dockerfiles + Traefik config
```

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev:docker
```

| Service | URL |
| --- | --- |
| Web | http://app.localhost |
| API | http://api.localhost |
| Swagger | http://api.localhost/docs |
| Docs | http://docs.localhost |
| Traefik dashboard | http://localhost:8080 |

`*.localhost` resolves to `127.0.0.1` automatically in modern browsers/OSes — no `/etc/hosts` edits needed.

## Monitoring stack

Loki, Promtail, Grafana, Prometheus, and node-exporter live in a separate compose file
(`docker-compose.monitoring.yml`) so you can run the app without them. It attaches to the
`app-platform` network created by the main stack, so **start the app stack first**:

```bash
pnpm dev:docker      # creates the app-platform network
pnpm monitoring:up   # -d; loki/grafana/prometheus/promtail/node-exporter
pnpm monitoring:down
```

| Service | URL |
| --- | --- |
| Grafana | http://grafana.localhost |
| Prometheus | http://localhost:9090 |

Tear down in the reverse order — `pnpm monitoring:down` before `pnpm dev:docker:down` — so the
`app-platform` network isn't left behind while monitoring containers are still attached.

Editing any file under `apps/*` or `packages/*` on the host reloads the corresponding container in place; images only need rebuilding when a `package.json` changes (`pnpm dev:docker:build`).

Run migrations and seed data once Postgres is up:

```bash
pnpm --filter @app-platform/api prisma:migrate
pnpm --filter @app-platform/api prisma:seed
```

See `apps/docs` (http://docs.localhost) for architecture diagrams and ADRs.
