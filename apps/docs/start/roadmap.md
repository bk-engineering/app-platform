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
| [เริ่มใช้งานใน 10 นาที](/start/quickstart) | <Status value="implemented" inline /> | |
| [ทัวร์โครงสร้าง repo](/start/repo-tour) | <Status value="implemented" inline /> | |
| [อภิธานศัพท์](/start/glossary) | <Status value="implemented" inline /> | |
| [ภาพรวมระบบ](/architecture/overview) | <Status value="implemented" inline /> | |
| [Container & routing](/architecture/containers) | <Status value="implemented" inline /> | ยังไม่มี compose/Dockerfile สำหรับ production |
| [Tech stack & เหตุผล](/architecture/tech-stack) | <Status value="implemented" inline /> | |
| [วงจรชีวิตของ request](/architecture/request-lifecycle) | <Status value="implemented" inline /> | |
| [Data model](/architecture/data-model) | <Status value="implemented" inline /> | 8 model + seed จริงแล้ว |

### ข้อตกลง & ข้ามระบบ

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [Contract-first](/conventions/contract-first) | <Status value="implemented" inline /> | api และ web ใช้ schema จาก contracts ทั้งคู่ |
| [ข้อตกลงของ API](/conventions/api-conventions) | <Status value="implemented" inline /> | `/v1` prefix, pagination, `WWW-Authenticate` ครบ |
| [Error envelope](/conventions/errors) | <Status value="implemented" inline /> | |
| [โครงสร้างโฟลเดอร์ · api](/conventions/structure-api) | <Status value="implemented" inline /> | มี `config/` แล้ว มีเทสแรกแล้ว |
| [โครงสร้างโฟลเดอร์ · web](/conventions/structure-web) | <Status value="implemented" inline /> | มี route group `(auth)`/`(app)` แล้ว |
| [Trace ID](/platform/trace-id) | <Status value="implemented" inline /> | ฝั่ง server และ client ครบ |
| [Config & environment](/platform/config) | <Status value="implemented" inline /> | `ConfigModule` validate ตอนบูตแล้ว |
| [Observability & logging](/platform/observability) | <Status value="implemented" inline /> | มี log ระดับ business event และ web error reporting แล้ว |
| [Health checks](/platform/health) | <Status value="implemented" inline /> | `/health/live` และ `/health/ready` เช็ค Postgres/Redis |
| [Security checklist](/platform/security) | <Status value="implemented" inline /> | CORS allowlist, helmet, rate limit ครบ |

### Auth & สิทธิ์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [ภาพรวม auth](/auth/overview) | <Status value="in-progress" inline /> | login/refresh/logout/logout-all/me ทำงานจริง ยังไม่มี register/OAuth/email flow |
| [JWT & refresh rotation](/auth/tokens) | <Status value="implemented" inline /> | rotation + reuse detection + logout/logout-all + issuer/audience check ทำงานจริง |
| [เข้าสู่ระบบ](/auth/login) | <Status value="in-progress" inline /> | endpoint + หน้าเว็บมีแล้ว แต่เก็บ token ใน sessionStorage ไม่ใช่ httpOnly cookie ตาม ADR-0006 |
| [สมัครสมาชิก & Google OAuth](/auth/signup) | <Status value="planned" inline /> | `POST /users` ต้อง auth แล้ว (manager ขึ้นไป) แต่ยังไม่ใช่ self-signup flow · ไม่มี OAuth (ต้องมี Google credentials) |
| [ลืมรหัสผ่าน](/auth/forgot-password) | <Status value="planned" inline /> | ต้องมีผู้ให้บริการส่งอีเมล |
| [ยืนยันอีเมล](/auth/email-verification) | <Status value="planned" inline /> | ต้องมีผู้ให้บริการส่งอีเมล |
| [Role & permission model](/auth/rbac-model) | <Status value="implemented" inline /> | |
| [CASL authorization](/auth/casl) | <Status value="implemented" inline /> | ทำงานจริงบน users module · แคชด้วย Redis (TTL 5 นาที) + มีเทสแล้ว |
| [Session ฝั่ง client](/frontend/auth-client) | <Status value="in-progress" inline /> | session/use-session/single-flight refresh ทำงานจริง แต่เป็น sessionStorage ไม่ใช่ httpOnly cookie ตาม ADR-0006 |
| [สิทธิ์บน UI](/frontend/permissions-client) | <Status value="implemented" inline /> | `AbilityProvider`/`<Can>`/`ForbiddenState` ทำงานจริง ใช้กรองหน้า settings/users |
| [ส่งอีเมล](/backend/email) | <Status value="planned" inline /> | ต้องมีผู้ให้บริการส่งอีเมล |

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
| [ภาพรวมฟรอนต์เอนด์](/frontend/overview) | <Status value="implemented" inline /> | ทุกเสาหลักต่อสายครบแล้ว เหลือแค่ server prefetch/hydration ที่ยังเป็น client-fetch |
| [Data fetching (TanStack Query)](/frontend/data-fetching) | <Status value="in-progress" inline /> | มี `query-keys.ts` + query/mutation hook ครบทุกทรัพยากร (users, roles, dashboard, me) แต่ยังไม่มี server prefetch + `HydrationBoundary` |
| [ฟอร์ม (react-hook-form + zod)](/frontend/forms) | <Status value="implemented" inline /> | `Field`/`FieldError`, `applyServerErrors`, mutation hook ต่อฟอร์มทำงานจริง |
| [ระบบ UI (shadcn/ui)](/frontend/ui-system) | <Status value="implemented" inline /> | `components.json` + `Button`/`Dialog`/`Select`/`Checkbox`/`Table`/ฯลฯ ผ่าน Radix จริงแล้ว |
| [i18n (next-intl)](/frontend/i18n) | <Status value="implemented" inline /> | `defaultLocale` แก้เป็น `th` แล้ว ตรง ADR-0011 |
| [ธีม & dark mode](/frontend/theming) | <Status value="implemented" inline /> | `next-themes` + CSS variable ต่อโหมด + `ThemeToggle` ทำงานจริง sync เข้า `User.theme` ด้วย |
| [Session ฝั่ง client](/frontend/auth-client) | <Status value="in-progress" inline /> | session/use-session/single-flight refresh ทำงานจริง แต่ยังเป็น sessionStorage ไม่ใช่ httpOnly cookie ตาม ADR-0006 |
| [สิทธิ์บน UI](/frontend/permissions-client) | <Status value="implemented" inline /> | `AbilityProvider`/`<Can>`/`ForbiddenState` ใช้กรองหน้า settings/users, settings/roles และเมนู |

### หน้าผลิตภัณฑ์

| หน้า | สถานะ | หมายเหตุ |
| --- | --- | --- |
| [แดชบอร์ด](/features/dashboard) | <Status value="implemented" inline /> | การ์ดสรุป + activity feed ทำงานจริง จาก `GET /v1/dashboard/summary` และ `GET /v1/audit-logs` |
| [ตั้งค่า · จัดการผู้ใช้](/features/settings-users) | <Status value="implemented" inline /> | list/search/create/edit/delete (soft delete) ทำงานจริง กรองด้วย `accessibleBy` และ field-level ability |
| [ตั้งค่า · Role & permission](/features/settings-roles) | <Status value="implemented" inline /> | สร้าง/แก้/ลบ role และติ๊ก permission ทำงานจริง พร้อม `ROLE_IN_USE` guard และล้างแคช ability เมื่อแก้สิทธิ์ |
| [ตั้งค่า · ธีม](/features/settings-theme) | <Status value="implemented" inline /> | เลือกโหมดสีแบบ optimistic + sync เข้า `PATCH /v1/auth/me` ทำงานจริง |
| [โปรไฟล์](/features/profile) | <Status value="in-progress" inline /> | แก้ `displayName`/ดู email/เปลี่ยนรหัสผ่านทำงานจริง — **ยังไม่มี** avatar upload และ Google account linking (ต้องใช้ object storage/Google credentials ที่ยังไม่ตั้งค่า) |

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
| 1 | `enableCors()` เปล่า = อนุญาตทุก origin | `apps/api/src/main.ts` | ต้องเป็น allowlist ก่อนขึ้น production |
| 2 | ไม่ validate env ตอนบูต | `apps/api/src/app.module.ts` | ตั้ง env ผิดจะไประเบิดตอน runtime แทนที่จะตายตั้งแต่บูต ดู [Config](/platform/config) |
| 3 | Redis ยกขึ้นมาแต่ไม่มีใครใช้ | `docker-compose.yml` | ต้องตัดสินใจว่าจะใช้ทำอะไร (throttler store / refresh denylist) หรือถอดออก |
| 4 | ไม่มี test สักไฟล์ | ทั้ง repo | `vitest` เป็น devDependency และ `turbo test` มีอยู่ แต่ไม่มีไฟล์เทส (ยกเว้น `users.service.spec.ts` ที่มีอยู่แล้วก่อนหน้า) |
| 5 | ไม่มี CI | ไม่มี `.github/` | ไม่มีอะไรกันการ merge โค้ดที่ build ไม่ผ่าน ดู [CI/CD](/ops/ci-cd) |
| 6 | `JwtAuthGuard` ไม่แยก expired จาก invalid | `apps/api/src/auth/jwt-auth.guard.ts` | ยังเป็น `AuthGuard("jwt")` เปล่า — client รีเฟรชเงียบ ๆ ไม่ได้ ต้องเตะผู้ใช้ออกทุก 15 นาที ดู [JWT & rotation](/auth/tokens) |
| 7 | access/refresh token ไม่ตรวจ `issuer`/`audience` | `apps/api/src/auth/strategies/jwt.strategy.ts` | token จากระบบอื่นที่แชร์ secret กันจะถูกยอมรับ |
| 8 | ไม่มี script `typecheck` ที่ไหนเลย | ทุก `package.json` ในโปรเจกต์ | type error หลุดไปได้โดยไม่มีอะไรจับ ดู [Lint, format & type-check](/quality/code-quality) |
| 9 | ไม่มี production Dockerfile/compose | `infra/docker/**`, root | มีแค่ dev stack ใช้งานจริงไม่ได้จนกว่าจะมี image สำหรับ production ดู [Docker & Traefik](/ops/docker-traefik) |
| 10 | token ฝั่ง client เก็บใน sessionStorage ไม่ใช่ httpOnly cookie | `apps/web/src/lib/session.ts` | ขัดกับ [ADR-0006](/adr/0006-token-storage-httponly-cookie) — ยังไม่ได้ทำ เพราะเป็นงานเปลี่ยนสถาปัตยกรรม auth แยกต่างหาก ดู [Session ฝั่ง client](/frontend/auth-client) |
| 11 | ไม่มี avatar upload / Google account linking | `apps/web/src/app/[locale]/(app)/profile/page.tsx` | ต้องมี object storage และ Google OAuth credentials ที่ยังไม่ได้ตั้งค่า ดู [โปรไฟล์](/features/profile) |

✅ แก้แล้ว: `defaultLocale` ของ web เคยเป็น `en` (แก้เป็น `th` แล้ว), `button.tsx` เคยเขียนเองไม่ใช่ของ shadcn (แทนที่ด้วย component จาก Radix แล้ว), และ throttler bucket `"auth"` (5 req/60s) เคยถูกใช้กับทุก route โดยไม่ตั้งใจ (จำกัดเฉพาะ `/v1/auth/token` แล้วด้วย `@SkipThrottle`)

## ขอบเขตของเอกสาร

Phase 0–7 เขียนครบแล้วทั้งสองภาษา — ทุกเสาหลักของ boilerplate (frontend, backend, auth/สิทธิ์, หน้าผลิตภัณฑ์, คุณภาพโค้ด, ปฏิบัติการ) มีสเปกอยู่ในเอกสารชุดนี้ ส่วนที่เหลือคือให้โค้ดไล่ตามสเปก ไม่ใช่เขียนเอกสารเพิ่ม — ตารางด้านบนคือระยะห่างระหว่างสองอย่างนั้น
