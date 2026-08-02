# Local development

```bash
pnpm install
pnpm dev:docker
```

This brings up Postgres, Redis, Traefik, and all three apps in watch mode. Source code is bind-mounted into each container, so editing files on the host hot-reloads inside the container — no image rebuild needed.

| Service | URL |
| --- | --- |
| Web | http://app.localhost |
| API | http://api.localhost |
| Swagger | http://api.localhost/docs |
| Docs | http://docs.localhost |
| Traefik dashboard | http://localhost:8080 |

Run database migrations and seed once Postgres is up:

```bash
pnpm --filter @app-platform/api prisma:migrate
pnpm --filter @app-platform/api prisma:seed
```
