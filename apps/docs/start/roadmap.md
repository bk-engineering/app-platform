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
| [Trace ID](/platform/trace-id) | <Status value="planned" inline /> | ไม่มี `genReqId`, ไม่มี AsyncLocalStorage |
| [Config & environment](/platform/config) | <Status value="planned" inline /> | `ConfigModule` ไม่มี `validate` |

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
| 9 | ไม่มี CI | ไม่มี `.github/` | ไม่มีอะไรกันการ merge โค้ดที่ build ไม่ผ่าน |
| 10 | `button.tsx` เขียนเองไม่ใช่ของ shadcn | `apps/web/src/components/ui/button.tsx` | ไม่มี Radix, ไม่มี `asChild`, ใช้ token `bg-brand-600` ที่ไม่มีนิยาม |

## ขอบเขตที่ยังไม่ได้เขียนเอกสาร

เอกสารรอบนี้ครอบคลุมถึง auth & สิทธิ์ ส่วนที่เหลือจะตามมา

- โครงสร้างโฟลเดอร์มาตรฐานของทั้งสองแอป, backend (validation, Prisma, OpenAPI, caching, jobs, file storage)
- frontend (data fetching, forms, ui system, i18n, theming)
- หน้าผลิตภัณฑ์ (dashboard, จัดการผู้ใช้, role editor, ตั้งค่าธีม, โปรไฟล์)
- observability, health check, security checklist
- กลยุทธ์การเทส, CI/CD, deployment, database operations
