---
title: พัฒนาบนเครื่อง
status: implemented
---

# พัฒนาบนเครื่อง

<Status value="implemented" />

ยังไม่เคยรัน stack? เริ่มที่ [เริ่มใช้งานใน 10 นาที](/start/quickstart) ก่อน หน้านี้ว่าด้วยงานประจำวัน

## เลือกโหมดการทำงาน

```mermaid
flowchart TD
  Q{"งานที่จะทำ<br/>แตะอะไรบ้าง?"}
  Q -->|"แก้ทั้ง stack /<br/>ต้องใช้ DB"| Docker["pnpm dev:docker"]
  Q -->|"แก้ UI อย่างเดียว /<br/>อยากได้ HMR เร็วสุด"| Hybrid["ยก infra ด้วย docker<br/>รันแอปบน host"]
  Q -->|"แก้เอกสาร"| Docs["pnpm --filter @app-platform/docs dev"]

  Docker --> D1["ครบทุกอย่าง ตรงกับที่คนอื่นเห็น<br/>ช้ากว่านิดหน่อย"]
  Hybrid --> H1["reload เร็วที่สุด<br/>ต้องแก้ DATABASE_URL เป็น localhost"]
  Docs --> S1["ไม่ต้องใช้ DB หรือ API เลย"]

  style D1 fill:#dcfce7,stroke:#16a34a
  style H1 fill:#fef9c3,stroke:#ca8a04
  style S1 fill:#dbeafe,stroke:#2563eb
```

### โหมด Docker (ค่าเริ่มต้น)

```bash
pnpm dev:docker            # ยกทั้ง stack
pnpm dev:docker:build      # บังคับ build image ใหม่ (หลังแก้ Dockerfile)
pnpm dev:docker:down       # หยุดทั้งหมด
```

โค้ดถูก bind mount เข้า container จึงแก้ไฟล์บนเครื่องแล้ว reload ในนั้นทันที ไม่ต้อง rebuild

### โหมดผสม (infra ใน Docker, แอปบน host)

เหมาะกับงาน frontend ล้วน — HMR เร็วกว่าเพราะไม่ต้องผ่าน bind mount

```bash
docker compose up postgres redis -d
```

แล้วแก้ `.env` ให้ชี้ localhost แทน hostname ของ Docker

```diff
-DATABASE_URL=postgresql://app:app@postgres:5432/app_platform?schema=public
+DATABASE_URL=postgresql://app:app@localhost:5432/app_platform?schema=public
-REDIS_URL=redis://redis:6379
+REDIS_URL=redis://localhost:6379
-NEXT_PUBLIC_API_URL=http://api.localhost
+NEXT_PUBLIC_API_URL=http://localhost:4000
```

จากนั้น

```bash
pnpm dev                                  # ทุกแอปผ่าน turbo
pnpm --filter @app-platform/web dev       # เฉพาะ web
pnpm --filter @app-platform/api dev       # เฉพาะ api
```

::: warning อย่า commit `.env` ที่แก้แล้ว
`.env` อยู่ใน `.gitignore` แต่ระวังการก๊อป `DATABASE_URL` ที่เป็น `localhost` ย้อนกลับไปใส่ `.env.example` — จะทำให้โหมด Docker ของคนอื่นพัง
:::

## ที่อยู่ของแต่ละอย่าง

| บริการ | ผ่าน Traefik | ผ่าน port ตรง |
| --- | --- | --- |
| Web | http://app.localhost | http://localhost:3000 |
| API | http://api.localhost | http://localhost:4000 |
| Swagger UI | http://api.localhost/docs | http://localhost:4000/docs |
| เอกสาร | http://docs.localhost | http://localhost:5173 |
| Traefik dashboard | — | http://localhost:8080 |
| Postgres | — | `localhost:5432` |
| Redis | — | `localhost:6379` |

## งานที่ทำบ่อย

### ฐานข้อมูล

```bash
# สร้าง migration หลังแก้ schema.prisma
pnpm --filter @app-platform/api prisma:migrate

# gen client ใหม่ (ปกติ migrate ทำให้แล้ว)
pnpm --filter @app-platform/api prisma:generate

# ใส่ข้อมูลตั้งต้น
pnpm --filter @app-platform/api prisma:seed

# ส่อง DB
docker compose exec postgres psql -U app -d app_platform
```

::: warning ใช้ `prisma:seed` อย่าใช้ `prisma db seed`
`prisma.config.ts` ตั้ง seed command เป็น `tsx prisma/seed.ts` แต่ `tsx` ไม่ได้อยู่ใน dependency ของ `apps/api` (มีแต่ `ts-node`) ดังนั้น `prisma db seed` จะพัง ส่วนสคริปต์ `prisma:seed` เรียก `ts-node` ตรง ๆ จึงใช้ได้ — ดู [Roadmap ข้อ 4](/start/roadmap)
:::

### เพิ่ม dependency

```bash
pnpm --filter @app-platform/web add <pkg>
pnpm --filter @app-platform/api add -D <pkg>
pnpm add -w -D <pkg>                        # ระดับ root
```

ถ้ารันโหมด Docker ต้อง restart service นั้นหลังเพิ่ม เพราะ `node_modules` ใน container เป็น named volume แยกจาก host — ดู [Container & routing](/architecture/containers#เร-องnode-modules-ใน-dev)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml restart api
```

### ตรวจคุณภาพโค้ด

```bash
pnpm lint          # eslint ทุก workspace
pnpm format        # prettier ทั้ง repo
pnpm test          # vitest (ยังไม่มีไฟล์เทส — ดู roadmap)
pnpm build         # build ทุกแอป
```

husky + lint-staged รัน `eslint --fix` และ `prettier --write` ให้อัตโนมัติตอน commit

### ดู log

```bash
docker compose logs -f api
docker compose logs -f web
```

ตอน dev, pino ส่ง log ผ่าน `pino-pretty` ให้อ่านง่าย ส่วน production เป็น JSON ล้วน สลับด้วย `NODE_ENV` และปรับความละเอียดด้วย `LOG_LEVEL` (`debug` เป็นค่าใน `.env.example`)

เมื่อ [trace id](/platform/trace-id) ถูก implement แล้ว จะไล่ log ของ request เดียวได้ด้วย

```bash
docker compose logs api | grep '<trace-id>'
```

## แก้ปัญหา

| อาการ | สาเหตุ | วิธีแก้ |
| --- | --- | --- |
| แก้ไฟล์แล้วไม่ reload | watcher ข้าม bind mount ไม่ทำงาน | compose ตั้ง `WATCHPACK_POLLING` / `CHOKIDAR_USEPOLLING` แล้ว ถ้ายังไม่ได้ให้ restart service |
| `Cannot find module '@app-platform/contracts'` | เพิ่ม dependency แล้วไม่ได้ sync เข้า container | restart service นั้น |
| Prisma client ไม่ตรงกับ schema | ยังไม่ได้ generate หลังแก้ schema | `pnpm --filter @app-platform/api prisma:generate` |
| CORS พังตอนรันโหมดผสม | `NEXT_PUBLIC_API_URL` ยังชี้ `api.localhost` แต่ API รันบน `localhost:4000` | แก้ `.env` ให้ตรงกับที่รันจริง |
| `*.localhost` ไม่ resolve | เบราว์เซอร์/OS ไม่รองรับ | เพิ่มลง `/etc/hosts` |
| port ชนกัน | มีของอื่นใช้ 80/3000/4000/5432 อยู่ | เปลี่ยนค่า `*_PORT` ใน `.env` |
| หลังเปลี่ยน branch แล้ว container เพี้ยน | `node_modules` ใน volume ค้างของเก่า | `pnpm dev:docker:down` แล้ว `pnpm dev:docker:build` |
| build เอกสารพังเพราะ dead link | เพิ่มหน้าไทยแล้วลืมมิเรอร์ `/en/` | สร้างไฟล์คู่ให้ครบ + ลงทะเบียนใน `.vitepress/structure.ts` |

## แก้เอกสาร

```bash
pnpm --filter @app-platform/docs dev      # http://localhost:5173
pnpm --filter @app-platform/docs build    # ตรวจ dead link ทั้งหมด
```

กฎของเอกสารอยู่ที่ [ADR-0015](/adr/0015-docs-as-bilingual-ssot) — หัวใจคือ **หนึ่งหน้าต้องมีทั้งไทยและอังกฤษเสมอ** ไม่งั้น build พัง
