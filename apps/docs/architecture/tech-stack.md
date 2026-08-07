---
title: Tech stack & เหตุผล
status: implemented
---

# Tech stack & เหตุผล

<Status value="implemented" />

ทุกแถวตอบคำถามเดียว: **ทำไมถึงเป็นตัวนี้** ถ้าจะเปลี่ยน ให้เขียน ADR ใหม่ที่ supersede ของเดิม

## Monorepo

| ชิ้น | เวอร์ชัน | ทำไม |
| --- | --- | --- |
| pnpm workspaces | 11.18.0 | ประหยัดดิสก์ด้วย content-addressable store, `node_modules` แบบเข้มงวดกันเรียก dependency ผี, `workspace:*` ผูก package ในเครือได้ตรง ๆ |
| Turborepo | ^2.10 | cache task ตาม content hash + รู้ลำดับ dependency แก้ไฟล์เดียวไม่ต้อง build ใหม่ทั้ง repo |
| TypeScript | ^5.9 | strict ทั้ง repo, `packages/config/tsconfig.base.json` เป็นฐานเดียวกัน |

→ [ADR-0002](/adr/0002-pnpm-turborepo-monorepo)

## Frontend

| ชิ้น | เวอร์ชัน | ทำไม |
| --- | --- | --- |
| Next.js | ^16.2 | App Router + React Server Components ลดขนาด JS ที่ส่งไป client, `output: standalone` ทำให้ image เล็ก, middleware (`proxy.ts`) ทำ i18n + route guard ได้ที่ขอบ |
| React | ^19.2 | ตามที่ Next 16 ต้องการ |
| TanStack Query | ^5.101 | จัดการ **server state** อย่างเดียว: cache, dedupe, refetch, invalidate — ไม่เอา global store มาปนกับข้อมูลจาก server |
| next-intl | ^4.13 | i18n แบบ locale-in-path ที่เข้าใจ App Router ใช้ได้ทั้ง server และ client component |
| Tailwind CSS | ^4.3 | v4 เป็น CSS-first — token อยู่ใน `@theme` ของ `packages/config/tailwind/theme.css` ไม่มี `tailwind.config.ts` |
| shadcn/ui | — | คัดลอกโค้ดเข้ามาใน repo ไม่ใช่ dependency แก้ได้ตามใจ ไม่ต้องรอ upstream |
| react-hook-form + `@hookform/resolvers` | ^7.84 / ^5.7 | uncontrolled form = re-render น้อย, `zodResolver` ทำให้ใช้ zod schema ตัวเดียวกับที่ API ใช้ได้ |
| zod | ^4.4 | ภาษาเดียวสำหรับ validate ทั้ง frontend และ backend |
| lucide-react | ^1.28 | ชุดไอคอนมาตรฐานของ shadcn |

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| ชุด component ของ shadcn ครบ | มีแค่ `button.tsx` ที่เขียนเอง ไม่มี Radix เป็น dependency, ใช้ token `bg-brand-600` ที่ไม่มีนิยามใน `globals.css` |
| ฟอร์มใช้ react-hook-form + zodResolver | ทั้งสองตัวติดตั้งแล้วแต่ยังไม่มีฟอร์มไหนใช้ |
:::

## Backend

| ชิ้น | เวอร์ชัน | ทำไม |
| --- | --- | --- |
| NestJS | ^11.1 | DI + โครงสร้างโมดูลที่บังคับขอบเขตชัด, pipe/guard/interceptor/filter ทำให้เรื่อง cross-cutting (validate, auth, trace, error) อยู่ที่เดียวไม่กระจาย |
| nestjs-zod | ^5.5 | `createZodDto()` แปลง zod schema เป็น DTO ที่ Swagger อ่านได้ — ใช้ contract ตัวเดียวกับ frontend แทนที่จะเขียน DTO ซ้ำด้วย class-validator |
| Prisma | ^7.9 | schema เป็นแหล่งความจริงของ DB, migration มีเวอร์ชัน, client type-safe, `@casl/prisma` ต่อยอดทำ row-level filter ได้ |
| `@prisma/adapter-pg` | ^7.9 | driver adapter คุยผ่าน `pg` ตรง ๆ ไม่ต้องพึ่ง query engine binary |
| PostgreSQL | 18-alpine | relational + JSONB + index ดี ๆ ครบ เป็นค่ามาตรฐานที่ปลอดภัย |
| nestjs-pino + pino-http | ^4.6 / ^11 | log เป็น JSON เร็วมาก และมี `genReqId` ที่จะใช้ทำ [trace id](/platform/trace-id) |
| `@nestjs/swagger` | ^11.4 | OpenAPI สร้างจากโค้ดอัตโนมัติที่ `/docs` |
| `@nestjs/jwt` + passport-jwt | ^11 / ^4 | JWT แบบ stateless พร้อม strategy ที่ผูกกับ guard ของ Nest |
| bcryptjs | ^3.0 | hash รหัสผ่านแบบไม่มี native binding — ข้ามแพลตฟอร์มใน Docker ได้ไม่มีปัญหา |

## ยังไม่ได้เพิ่มแต่จะต้องมี

| ชิ้น | เอาไปทำอะไร | หน้า |
| --- | --- | --- |
| `@casl/ability` + `@casl/prisma` | authorization ที่ใช้ ability ชุดเดียวทั้ง server และ UI | [CASL](/auth/casl) |
| `@nestjs/throttler` | rate limit หน้า login และ endpoint ที่ส่งอีเมล | [เข้าสู่ระบบ](/auth/login) |
| `helmet` | security header | [Roadmap](/start/roadmap) |
| `@nestjs/terminus` | readiness probe ที่เช็ค db/redis จริง | [Roadmap](/start/roadmap) |
| ผู้ให้บริการอีเมล + Mailpit | ลืมรหัสผ่าน / ยืนยันอีเมล | [ส่งอีเมล](/backend/email) |
| `next-themes` | สลับธีมแบบไม่มี FOUC | [Roadmap](/start/roadmap) |
| Radix UI primitives | เป็นฐานของ component ชุด shadcn | [Roadmap](/start/roadmap) |

## ทางเลือกที่ปฏิเสธ

| แทนที่จะใช้ | เราเลือก | เพราะ |
| --- | --- | --- |
| class-validator + class-transformer | zod ผ่าน nestjs-zod | class-validator ใช้ร่วมกับ frontend ไม่ได้ ต้องเขียนกฎซ้ำสองที่แล้วจะเพี้ยนกันแน่นอน |
| tRPC | REST + zod contracts | REST ทำให้ Swagger, client อื่น ๆ และ debug ผ่าน curl ยังใช้ได้ตามปกติ ส่วน type safety ได้จาก contracts อยู่แล้ว |
| NextAuth / Auth.js | JWT ที่ออกโดย API เอง | ต้องให้ API เป็นเจ้าของ identity เพื่อรองรับ client อื่นนอกจากเว็บ NextAuth ผูกกับ Next มากเกินไป |
| TypeORM / Drizzle | Prisma | migration workflow ดีกว่า และ `@casl/prisma` ทำ authorization ระดับแถวได้เลย |
| Redux / Zustand สำหรับข้อมูล server | TanStack Query | ข้อมูลจาก server ไม่ใช่ client state การเอามาเก็บใน store คือการเขียน cache เองแบบมีบั๊ก |
| microservices | modular monolith | ดู [ADR-0004](/adr/0004-modular-monolith) |
| Kong / nginx | Traefik | ค้นหา service จาก docker label อัตโนมัติ config สั้นกว่ามากสำหรับ dev |
| Docusaurus / Nextra | VitePress | เร็ว, มี local search ในตัว, i18n ตรงไปตรงมา, ปลั๊กอิน mermaid ใช้ได้เลย |
