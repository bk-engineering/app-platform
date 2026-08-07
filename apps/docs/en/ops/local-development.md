---
title: Local development
status: implemented
---

# Local development

<Status value="implemented" />

Never run the stack before? Start with the [Quickstart](/en/start/quickstart). This page is about day-to-day work.

## Choosing a mode

```mermaid
flowchart TD
  Q{"What are you<br/>working on?"}
  Q -->|"Full stack /<br/>needs the database"| Docker["pnpm dev:docker"]
  Q -->|"UI only /<br/>want the fastest HMR"| Hybrid["infra in docker<br/>apps on the host"]
  Q -->|"Documentation"| Docs["pnpm --filter @app-platform/docs dev"]

  Docker --> D1["Everything, matching what others see<br/>slightly slower"]
  Hybrid --> H1["Fastest reloads<br/>requires DATABASE_URL=localhost"]
  Docs --> S1["No database or API needed"]

  style D1 fill:#dcfce7,stroke:#16a34a
  style H1 fill:#fef9c3,stroke:#ca8a04
  style S1 fill:#dbeafe,stroke:#2563eb
```

### Docker mode (default)

```bash
pnpm dev:docker            # bring up the whole stack
pnpm dev:docker:build      # force an image rebuild (after changing a Dockerfile)
pnpm dev:docker:down       # stop everything
```

Source is bind-mounted into the containers, so editing on the host reloads inside immediately — no rebuild.

### Hybrid mode (infra in Docker, apps on the host)

Best for pure frontend work — HMR is faster without going through the bind mount.

```bash
docker compose up postgres redis -d
```

Then point `.env` at localhost instead of the Docker hostnames:

```diff
-DATABASE_URL=postgresql://app:app@postgres:5432/app_platform?schema=public
+DATABASE_URL=postgresql://app:app@localhost:5432/app_platform?schema=public
-REDIS_URL=redis://redis:6379
+REDIS_URL=redis://localhost:6379
-NEXT_PUBLIC_API_URL=http://api.localhost
+NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then:

```bash
pnpm dev                                  # all apps via turbo
pnpm --filter @app-platform/web dev       # web only
pnpm --filter @app-platform/api dev       # api only
```

::: warning Don't commit your edited `.env`
`.env` is gitignored, but be careful not to copy a `localhost` `DATABASE_URL` back into `.env.example` — that breaks Docker mode for everyone else.
:::

## Where everything lives

| Service | Via Traefik | Direct port |
| --- | --- | --- |
| Web | http://app.localhost | http://localhost:3000 |
| API | http://api.localhost | http://localhost:4000 |
| Swagger UI | http://api.localhost/docs | http://localhost:4000/docs |
| Docs | http://docs.localhost | http://localhost:5173 |
| Traefik dashboard | — | http://localhost:8080 |
| Postgres | — | `localhost:5432` |
| Redis | — | `localhost:6379` |

## Common tasks

### Database

```bash
# create a migration after editing schema.prisma
pnpm --filter @app-platform/api prisma:migrate

# regenerate the client (migrate usually does this for you)
pnpm --filter @app-platform/api prisma:generate

# load starter data
pnpm --filter @app-platform/api prisma:seed

# poke around
docker compose exec postgres psql -U app -d app_platform
```

::: warning Use `prisma:seed`, not `prisma db seed`
`prisma.config.ts` sets the seed command to `tsx prisma/seed.ts`, but `tsx` isn't a dependency of `apps/api` (only `ts-node` is), so `prisma db seed` fails. The `prisma:seed` script calls `ts-node` directly and works — see [Roadmap item 4](/en/start/roadmap).
:::

### Adding a dependency

```bash
pnpm --filter @app-platform/web add <pkg>
pnpm --filter @app-platform/api add -D <pkg>
pnpm add -w -D <pkg>                        # repo root
```

In Docker mode, restart the service afterwards — container `node_modules` are named volumes, separate from the host's. See [Containers & routing](/en/architecture/containers).

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml restart api
```

### Code quality

```bash
pnpm lint          # eslint across every workspace
pnpm format        # prettier across the repo
pnpm test          # vitest (no test files yet — see the roadmap)
pnpm build         # build every app
```

husky + lint-staged run `eslint --fix` and `prettier --write` on commit.

### Logs

```bash
docker compose logs -f api
docker compose logs -f web
```

In development, pino pipes through `pino-pretty`; production emits raw JSON. `NODE_ENV` switches between them and `LOG_LEVEL` sets verbosity (`.env.example` uses `debug`).

Once [trace id](/en/platform/trace-id) is implemented you'll be able to isolate a single request:

```bash
docker compose logs api | grep '<trace-id>'
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Edits don't reload | The file watcher misses changes over the bind mount | Compose sets `WATCHPACK_POLLING` / `CHOKIDAR_USEPOLLING`; if it still fails, restart the service |
| `Cannot find module '@app-platform/contracts'` | Added a dependency without syncing into the container | Restart that service |
| Prisma client doesn't match the schema | Didn't regenerate after editing the schema | `pnpm --filter @app-platform/api prisma:generate` |
| CORS errors in hybrid mode | `NEXT_PUBLIC_API_URL` still points at `api.localhost` while the API runs on `localhost:4000` | Point `.env` at what's actually running |
| `*.localhost` doesn't resolve | Browser or OS doesn't support it | Add entries to `/etc/hosts` |
| Port conflicts | Something else is on 80/3000/4000/5432 | Change the `*_PORT` values in `.env` |
| Containers act strange after a branch switch | Stale `node_modules` in the volumes | `pnpm dev:docker:down` then `pnpm dev:docker:build` |
| Docs build fails on a dead link | Added a Thai page without its `/en/` mirror | Create both files and register them in `.vitepress/structure.ts` |

## Working on the docs

```bash
pnpm --filter @app-platform/docs dev      # http://localhost:5173
pnpm --filter @app-platform/docs build    # catches every dead link
```

The rules are in [ADR-0015](/en/adr/0015-docs-as-bilingual-ssot). The core one: **every page must exist in both Thai and English**, or the build fails.
