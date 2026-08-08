---
title: สถานะ & Roadmap
status: implemented
---

# สถานะ & Roadmap

<Status value="implemented" />

หน้านี้คือกระดานสถานะรวม — เอกสารเป็นสเปกเป้าหมาย ตารางนี้บอกว่าโค้ดตามไปถึงไหนแล้ว

ความหมายของแต่ละป้ายอยู่ที่ [ความหมายของสถานะ](/reference/status-legend)

## ตามหน้าเอกสาร

### เริ่มต้น & สถาปัตยกรรม

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [boilerplate นี้คืออะไร](/start/introduction) | <Status value="implemented" inline /> | |
| [เริ่มใช้งานใน 10 นาที](/start/quickstart) | <Status value="in-progress" inline /> | seed พังผ่าน `prisma db seed` (tsx/ts-node ไม่ตรง) |
| [ทัวร์โครงสร้าง repo](/start/repo-tour) | <Status value="implemented" inline /> | |
| [อภิธานศัพท์](/start/glossary) | <Status value="implemented" inline /> | |
| [ภาพรวมระบบ](/architecture/overview) | <Status value="implemented" inline /> | |
| [Container & routing](/architecture/containers) | <Status value="implemented" inline /> | ยังไม่มี compose/Dockerfile สำหรับ production |
| [Tech stack & เหตุผล](/architecture/tech-stack) | <Status value="implemented" inline /> | |
| [วงจรชีวิตของ request](/architecture/request-lifecycle) | <Status value="planned" inline /> | ยังไม่มี interceptor / exception filter |
| [Data model](/architecture/data-model) | <Status value="planned" inline /> | schema มีแค่ `User` |

### ข้อตกลง & ข้ามระบบ

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [Contract-first](/conventions/contract-first) | <Status value="in-progress" inline /> | contracts ใช้กับ api แล้ว ฝั่ง web ยังไม่ได้ใช้ |
| [ข้อตกลงของ API](/conventions/api-conventions) | <Status value="in-progress" inline /> | ไม่มี `/v1` prefix, `paginatedSchema` ยังไม่มีใครใช้ |
| [Error envelope](/conventions/errors) | <Status value="planned" inline /> | ยังใช้รูปแบบ error default ของ Nest |
| [โครงสร้างโฟลเดอร์ · api](/conventions/structure-api) | <Status value="in-progress" inline /> | มีแค่ auth, users, prisma, health |
| [โครงสร้างโฟลเดอร์ · web](/conventions/structure-web) | <Status value="in-progress" inline /> | มีแค่ route เดียว |
| [Trace ID](/platform/trace-id) | <Status value="planned" inline /> | ไม่มี `genReqId`, ไม่มี AsyncLocalStorage |
| [Config & environment](/platform/config) | <Status value="planned" inline /> | `ConfigModule` ไม่มี `validate` |
| [Observability & logging](/platform/observability) | <Status value="in-progress" inline /> | pino ต่อแล้ว แต่ยังไม่ผูกกับ trace id |
| [Health checks](/platform/health) | <Status value="in-progress" inline /> | `GET /health` เป็น liveness เฉย ๆ ไม่เช็ค DB/Redis |
| [Security checklist](/platform/security) | <Status value="planned" inline /> | CORS เปิดกว้าง, ไม่มี helmet, ไม่มี rate limit |

### Auth & สิทธิ์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [ภาพรวม auth](/auth/overview) | <Status value="in-progress" inline /> | |
| [JWT & refresh rotation](/auth/tokens) | <Status value="in-progress" inline /> | ออก token ได้ แต่ไม่มี rotation/revoke |
| [เข้าสู่ระบบ](/auth/login) | <Status value="in-progress" inline /> | endpoint มี · หน้าเว็บยังไม่มี |
| [สมัครสมาชิก & Google OAuth](/auth/signup) | <Status value="planned" inline /> | `POST /users` มีอยู่แต่ **ไม่มี guard** · ไม่มี OAuth |
| [ลืมรหัสผ่าน](/auth/forgot-password) | <Status value="planned" inline /> | |
| [ยืนยันอีเมล](/auth/email-verification) | <Status value="planned" inline /> | |
| [Role & permission model](/auth/rbac-model) | <Status value="planned" inline /> | |
| [CASL authorization](/auth/casl) | <Status value="planned" inline /> | ไม่ได้ติดตั้ง `@casl/*` |
| [Session ฝั่ง client](/frontend/auth-client) | <Status value="planned" inline /> | |
| [สิทธิ์บน UI](/frontend/permissions-client) | <Status value="planned" inline /> | |
| [ส่งอีเมล](/backend/email) | <Status value="planned" inline /> | |

### แบ็กเอนด์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [ภาพรวมแบ็กเอนด์](/backend/overview) | <Status value="in-progress" inline /> | validation กับ Swagger ทำงานจริง |
| [Validation (zod pipe)](/backend/validation) | <Status value="implemented" inline /> | |
| [Prisma & data access](/backend/prisma) | <Status value="in-progress" inline /> | schema มีแค่ model `User` และ seed พัง |
| [OpenAPI / Swagger](/backend/openapi) | <Status value="implemented" inline /> | ใช้งานจริงที่ `api.localhost/docs` |
| [Caching (Redis)](/backend/caching) | <Status value="planned" inline /> | Redis รันอยู่แต่ไม่มีโค้ดใช้เลย |
| [งานเบื้องหลัง (jobs & queues)](/backend/jobs) | <Status value="planned" inline /> | ไม่มี BullMQ หรือ worker |
| [จัดเก็บไฟล์](/backend/file-storage) | <Status value="planned" inline /> | ไม่มี multer/S3 client เลย |

### ฟรอนต์เอนด์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [ภาพรวมฟรอนต์เอนด์](/frontend/overview) | <Status value="in-progress" inline /> | |
| [Data fetching (TanStack Query)](/frontend/data-fetching) | <Status value="in-progress" inline /> | มี provider แต่ไม่มี query hook สักตัว |
| [ฟอร์ม (react-hook-form + zod)](/frontend/forms) | <Status value="planned" inline /> | ติดตั้ง lib ไว้แล้วแต่ไม่มี form component |
| [ระบบ UI (shadcn/ui)](/frontend/ui-system) | <Status value="planned" inline /> | `button.tsx` เขียนเองไม่ใช่ของจริงจาก shadcn |
| [i18n (next-intl)](/frontend/i18n) | <Status value="in-progress" inline /> | `defaultLocale` ยังเป็น `en` ขัดกับ ADR-0011 |
| [ธีม & dark mode](/frontend/theming) | <Status value="planned" inline /> | ไม่มี theme provider เลย |
| [Session ฝั่ง client](/frontend/auth-client) | <Status value="planned" inline /> | |
| [สิทธิ์บน UI](/frontend/permissions-client) | <Status value="planned" inline /> | |

### หน้าผลิตภัณฑ์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [แดชบอร์ด](/features/dashboard) | <Status value="planned" inline /> | ไม่มีหน้า UI ใด ๆ นอกจาก home page |
| [ตั้งค่า · จัดการผู้ใช้](/features/settings-users) | <Status value="planned" inline /> | มีแค่ `POST /users` แบบ public |
| [ตั้งค่า · Role & permission](/features/settings-roles) | <Status value="planned" inline /> | ไม่มีตาราง `Role`/`Permission` |
| [ตั้งค่า · ธีม](/features/settings-theme) | <Status value="planned" inline /> | `User.theme` ยังไม่มีคอลัมน์ |
| [โปรไฟล์](/features/profile) | <Status value="planned" inline /> | ไม่มี avatar upload, ไม่มี Google linking |

### คุณภาพโค้ด

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [กลยุทธ์การเทส](/quality/testing) | <Status value="planned" inline /> | `vitest` ติดตั้งแล้วแต่ไม่มีไฟล์เทสเลย |
| [Lint, format & type-check](/quality/code-quality) | <Status value="in-progress" inline /> | eslint/prettier/husky ทำงานจริง แต่ไม่มี script `typecheck` |

### ปฏิบัติการ & อ้างอิง

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [Docker & Traefik](/ops/docker-traefik) | <Status value="in-progress" inline /> | dev stack ใช้งานจริง ไม่มี production image |
| [CI/CD](/ops/ci-cd) | <Status value="planned" inline /> | ไม่มี `.github/workflows` เลย |
| [Deployment](/ops/deployment) | <Status value="planned" inline /> | ยังไม่ได้เลือก target platform |
| [งานปฏิบัติการฐานข้อมูล](/ops/database-ops) | <Status value="planned" inline /> | ไม่มี backup, ไม่มี migrate deploy ใน CI/CD |
| [API endpoint catalog](/reference/api-endpoints) | <Status value="in-progress" inline /> | endpoint จริงมีน้อย ไม่มี `/v1` prefix |
| [Contract schema catalog](/reference/contracts) | <Status value="in-progress" inline /> | schema ตรงกับโค้ด แต่ web ยังไม่ได้ใช้ |

## หนี้ที่ต้องใช้คืน

รายการที่รู้อยู่แล้วว่าผิดหรือขัดกับสเปก เรียงตามความเร่งด่วน

| # | เรื่อง | อยู่ที่ | ทำไมต้องแก้ |
| --- | --- | --- | --- |
| 1 | `POST /users` เปิด public ไม่มี guard | `apps/api/src/users/users.controller.ts` | ใครก็สร้างบัญชีได้ ต้องปิดหรือทำให้เป็น signup flow ที่ตั้งใจ ดู [สมัครสมาชิก](/auth/signup) |
| 2 | `enableCors()` เปล่า = อนุญาตทุก origin | `apps/api/src/main.ts` | ต้องเป็น allowlist ก่อนขึ้น production |
| 3 | refresh token ใช้ซ้ำได้ไม่จำกัด | `apps/api/src/auth/auth.service.ts` | ต้องทำ rotation + reuse detection ดู [JWT & refresh rotation](/auth/tokens) |
| 4 | seed พังผ่าน `prisma db seed` | `apps/api/prisma.config.ts` สั่ง `tsx` แต่ไม่มี `tsx` ใน deps | ทำให้คำสั่งมาตรฐานของ Prisma ใช้ไม่ได้ |
| 5 | ไม่ validate env ตอนบูต | `apps/api/src/app.module.ts` | ตั้ง env ผิดจะไประเบิดตอน runtime แทนที่จะตายตั้งแต่บูต ดู [Config](/platform/config) |
| 6 | `defaultLocale` ของ web เป็น `en` | `apps/web/src/i18n/routing.ts` | ขัดกับ [ADR-0011](/adr/0011-thai-default-locale) ที่ตกลงว่าไทยเป็นหลัก |
| 7 | Redis ยกขึ้นมาแต่ไม่มีใครใช้ | `docker-compose.yml` | ต้องตัดสินใจว่าจะใช้ทำอะไร (throttler store / refresh denylist) หรือถอดออก |
| 8 | ไม่มี test สักไฟล์ | ทั้ง repo | `vitest` เป็น devDependency และ `turbo test` มีอยู่ แต่ไม่มีไฟล์เทส |
| 9 | ไม่มี CI | ไม่มี `.github/` | ไม่มีอะไรกันการ merge โค้ดที่ build ไม่ผ่าน ดู [CI/CD](/ops/ci-cd) |
| 10 | `button.tsx` เขียนเองไม่ใช่ของ shadcn | `apps/web/src/components/ui/button.tsx` | ไม่มี Radix, ไม่มี `asChild`, ใช้ token `bg-brand-600` ที่ไม่มีนิยาม ดู [ระบบ UI](/frontend/ui-system) |
| 11 | ไม่มี script `typecheck` ที่ไหนเลย | ทุก `package.json` ในโปรเจกต์ | type error หลุดไปได้โดยไม่มีอะไรจับ ดู [Lint, format & type-check](/quality/code-quality) |
| 12 | ไม่มี production Dockerfile/compose | `infra/docker/**`, root | มีแค่ dev stack ใช้งานจริงไม่ได้จนกว่าจะมี image สำหรับ production ดู [Docker & Traefik](/ops/docker-traefik) |

## ขอบเขตของเอกสาร

Phase 0–7 เขียนครบแล้วทั้งสองภาษา — ทุกเสาหลักของ boilerplate (frontend, backend, auth/สิทธิ์, หน้าผลิตภัณฑ์, คุณภาพโค้ด, ปฏิบัติการ) มีสเปกอยู่ในเอกสารชุดนี้ ส่วนที่เหลือคือให้โค้ดไล่ตามสเปก ไม่ใช่เขียนเอกสารเพิ่ม — ตารางด้านบนคือระยะห่างระหว่างสองอย่างนั้น
