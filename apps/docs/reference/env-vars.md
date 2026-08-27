---
title: Environment variables
status: in-progress
statusNote: ตัวที่มีอยู่ยังไม่ถูก validate และตัวที่วางแผนไว้ยังไม่มีในโค้ด
---

# Environment variables

<Status value="in-progress" />

รายการรวมทุก env วิธี validate อยู่ที่ [Config & environment](/platform/config)

**ใครใช้:** 🐘 postgres · 🔴 redis · 🚦 traefik · ⚙️ api · 🌐 web · 📘 docs · 🐳 compose

## มีอยู่แล้วใน `.env.example`

### ฐานข้อมูล

| ตัวแปร | ใครใช้ | บังคับ | ค่าเริ่มต้น | ความลับ | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `POSTGRES_USER` | 🐘🐳 | ✅ | `app` | | ผู้ใช้ที่ถูกสร้างตอน container ขึ้นครั้งแรก |
| `POSTGRES_PASSWORD` | 🐘🐳 | ✅ | `app` | 🔒 | เปลี่ยนก่อนขึ้นทุก environment ที่ไม่ใช่เครื่องตัวเอง |
| `POSTGRES_DB` | 🐘🐳 | ✅ | `app_platform` | | |
| `POSTGRES_PORT` | 🐳 | | `5432` | | port ที่ publish ออกมาที่เครื่อง |
| `DATABASE_URL` | ⚙️ | ✅ | `postgresql://app:app@postgres:5432/app_platform?schema=public` | 🔒 | **host เป็น `postgres`** ใช้ได้เฉพาะใน Docker network — รันบนเครื่องตรง ๆ ต้องเปลี่ยนเป็น `localhost` |

### Redis

| ตัวแปร | ใครใช้ | บังคับ | ค่าเริ่มต้น | หมายเหตุ |
| --- | --- | --- | --- | --- |
| `REDIS_PORT` | 🐳 | | `6379` | |
| `REDIS_URL` | ⚙️ | | `redis://redis:6379` | **ยังไม่มีโค้ดไหนอ่านค่านี้** |

### API

| ตัวแปร | ใครใช้ | บังคับ | ค่าเริ่มต้น | ความลับ | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `API_PORT` | ⚙️🐳 | | `4000` | | อ่านจาก `process.env` ตรง ๆ ใน `main.ts` |
| `JWT_ACCESS_SECRET` | ⚙️ | ✅ | — | 🔒 | ต้อง ≥ 32 ตัวอักษร สร้างด้วย `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRES_IN` | ⚙️ | | `15m` | | สั้นไว้ดี — token ที่หลุดจะหมดอายุเร็ว |
| `LOG_LEVEL` | ⚙️ | | `info` (`.env.example` ตั้ง `debug`) | | `debug` เฉพาะ non-production — มีข้อมูล query |
| `SEED_ADMIN_EMAIL` | ⚙️ | ✅ ตอน seed | — | | ผู้ดูแลคนแรก ดู `seed.ts` |
| `SEED_ADMIN_PASSWORD` | ⚙️ | ✅ ตอน seed | — | 🔒 | ต้องเปลี่ยนหลัง login ครั้งแรก — ยังไม่มี guard บังคับเรื่องนี้ในโค้ด |

::: tip `JWT_REFRESH_SECRET` เลิกใช้แล้ว
refresh token เปลี่ยนจาก JWT เป็น random string ที่เก็บ hash ไว้ใน DB (ดู [JWT & rotation](/auth/tokens)) จึงไม่ต้องมี secret แยกสำหรับ sign/verify refresh token อีกต่อไป
:::

::: danger ค่าตัวอย่างของ secret ต้องไม่ถูกใช้จริง
`.env.example` ตั้ง `JWT_ACCESS_SECRET=change-me-access-secret` และ `.env.example` กับ `.env` เหมือนกันทุกไบต์ แปลว่ามีโอกาสสูงที่จะมีคนก๊อปไปใช้ทั้งดุ้น [EnvSchema](/platform/config) จึงมี `refine` ที่บล็อกค่าขึ้นต้นด้วย `change-me` ไว้
:::

### Web

| ตัวแปร | ใครใช้ | บังคับ | ค่าเริ่มต้น | หมายเหตุ |
| --- | --- | --- | --- | --- |
| `WEB_PORT` | 🐳 | | `3000` | |
| `NEXT_PUBLIC_API_URL` | 🌐 | ✅ | `http://api.localhost` | **ถูกฝังตอน build และเบราว์เซอร์เห็น** — ห้ามใส่ความลับ |

::: warning `NEXT_PUBLIC_*` ถูกฝังตอน build
ค่าถูกแทนที่เป็น literal ตอน `next build` ไม่ใช่อ่านตอนรัน การเปลี่ยนค่าใน production จึงไม่มีผลจนกว่าจะ build image ใหม่ ทุกคนที่โหลดเว็บอ่านค่านี้ได้ — ดู [Config](/platform/config)
:::

### เอกสาร & Traefik

| ตัวแปร | ใครใช้ | ค่าเริ่มต้น | หมายเหตุ |
| --- | --- | --- | --- |
| `DOCS_PORT` | 📘🐳 | `5173` | ใช้ในสคริปต์ `dev` ของ `@app-platform/docs` |
| `TRAEFIK_DASHBOARD_PORT` | 🚦🐳 | `8080` | dashboard เปิดแบบ insecure — dev เท่านั้น |

### ที่ compose ตั้งให้เอง

| ตัวแปร | ใครใช้ | ค่า | ทำไม |
| --- | --- | --- | --- |
| `WATCHPACK_POLLING` | 🌐 | `true` | file watcher ของ Next ทำงานข้าม bind mount ไม่ได้ ต้อง poll |
| `CHOKIDAR_USEPOLLING` | ⚙️ | `true` | เหตุผลเดียวกันสำหรับ ts-node-dev |
| `CI` | 🌐⚙️📘 | `true` | ปิด prompt แบบโต้ตอบใน container |

## ที่ยังไม่มี แต่สเปกต้องการ

<Status value="planned" inline />

### Runtime ของ API

| ตัวแปร | บังคับ | ค่าเริ่มต้น | ความลับ | หมายเหตุ | หน้า |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | | `development` | | `development` \| `test` \| `production` | [Config](/platform/config) |
| `CORS_ORIGINS` | ✅ | — | | รายการ origin คั่นด้วย comma แทน `enableCors()` ที่เปิดหมด | [Config](/platform/config) |
| `APP_WEB_URL` | ✅ | `http://app.localhost` | | ฐานของลิงก์ที่ส่งในอีเมล | [ส่งอีเมล](/backend/email) |

### Google OAuth

| ตัวแปร | บังคับ | ความลับ | หมายเหตุ |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | เมื่อเปิดใช้ | | จาก Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | เมื่อเปิดใช้ | 🔒 | |
| `GOOGLE_CALLBACK_URL` | เมื่อเปิดใช้ | | ต้องตรงกับที่ลงทะเบียนไว้เป๊ะ ๆ เช่น `http://api.localhost/v1/auth/google/callback` |

ตั้งตัวใดตัวหนึ่งแล้วต้องตั้งครบทั้งสาม — [EnvSchema](/platform/config) บังคับด้วย `refine` ดู [สมัครสมาชิก](/auth/signup)

### อีเมล

| ตัวแปร | บังคับ | ค่าเริ่มต้น | ความลับ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| `MAIL_TRANSPORT` | | `console` | | `smtp` \| `console` — `console` พิมพ์ลง log แทนการส่งจริง |
| `MAIL_FROM` | | `no-reply@app-platform.local` | | |
| `SMTP_URL` | เมื่อ `MAIL_TRANSPORT=smtp` | — | 🔒 | เช่น `smtp://mailpit:1025` ตอน dev |
| `MAIL_VERIFY_TTL` | | `24h` | | อายุ token ยืนยันอีเมล |
| `MAIL_RESET_TTL` | | `1h` | | อายุ token รีเซ็ตรหัสผ่าน — สั้นกว่าโดยตั้งใจ |

### Rate limit

| ตัวแปร | ค่าเริ่มต้น | หมายเหตุ |
| --- | --- | --- |
| `THROTTLE_TTL` | `60` | ขนาดหน้าต่าง (วินาที) |
| `THROTTLE_LIMIT` | `100` | จำนวน request ต่อหน้าต่างของ endpoint ทั่วไป |
| `THROTTLE_AUTH_LIMIT` | `5` | เฉพาะ login/forgot-password — เข้มกว่ามาก |

### ไฟล์

| ตัวแปร | ค่าเริ่มต้น | หมายเหตุ |
| --- | --- | --- |
| `STORAGE_DRIVER` | `local` | `local` \| `s3` |
| `STORAGE_LOCAL_PATH` | `./uploads` | ใช้เมื่อ driver เป็น `local` |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | — | ใช้เมื่อ driver เป็น `s3` (สองตัวหลังเป็นความลับ 🔒) |

## เพิ่ม env ตัวใหม่

1. เติมใน `EnvSchema` (`apps/api/src/config/env.schema.ts`) — secret **ห้ามมี default**
2. เติมใน `.env.example` พร้อมคอมเมนต์
3. เติมใน `environment:` ของ service ใน `docker-compose.yml`
4. เติมแถวในหน้านี้ **และ** ในเวอร์ชันอังกฤษ
5. secret → ไปเพิ่มใน secret manager ของ production ก่อน deploy
6. อ่านผ่าน `ConfigService` เท่านั้น

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| ทุก env ผ่าน `EnvSchema` | ไม่มีการ validate — `ConfigModule.forRoot({ isGlobal: true })` เฉย ๆ |
| อ่านผ่าน `ConfigService` เท่านั้น | `main.ts` อ่าน `process.env.API_PORT` และ `app.module.ts` อ่าน `LOG_LEVEL`/`NODE_ENV` ตรง ๆ |
| `CORS_ORIGINS` เป็น allowlist | ✅ ทำแล้ว — `enableCors({ origin: env.CORS_ORIGINS, ... })` |
| `REDIS_URL` มีคนใช้ | ตั้งไว้แต่ไม่มีโค้ดอ้างถึง |
| `NEXT_PUBLIC_API_URL` มีคนใช้ | ตั้งไว้แต่ไม่มีไฟล์ไหนใน `apps/web` อ้างถึง |
| `.env.example` ต่างจาก `.env` | ทั้งสองไฟล์เหมือนกันทุกไบต์ |
:::
