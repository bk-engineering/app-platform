---
title: ภาพรวมระบบ
status: implemented
---

# ภาพรวมระบบ

<Status value="implemented" />

หน้าเดียวจบสำหรับ mental model ของทั้งระบบ รายละเอียดแต่ละส่วนอยู่ในหน้าที่ลิงก์ไว้

## บริบท

```mermaid
flowchart LR
  User(["ผู้ใช้"])
  Admin(["ผู้ดูแลระบบ"])
  Google["Google<br/>OAuth 2.0"]
  Mail["ผู้ให้บริการอีเมล"]

  subgraph Platform["app-platform"]
    Web["apps/web<br/>Next.js"]
    Api["apps/api<br/>NestJS"]
    Docs["apps/docs<br/>VitePress"]
  end

  User -->|HTTPS| Web
  Admin -->|HTTPS| Web
  Web -->|REST + Bearer JWT| Api
  Api -.->|OIDC| Google
  Api -.->|SMTP / API| Mail
  Admin -->|อ่านสเปก| Docs

  classDef ext fill:#f5f5f5,stroke:#999,stroke-dasharray:4 3
  class Google,Mail ext
```

Google OAuth และผู้ให้บริการอีเมลยังเป็นเส้นประ — ยังไม่ได้ implement ([สมัครสมาชิก](/auth/signup), [ส่งอีเมล](/backend/email))

## องค์ประกอบ

```mermaid
flowchart TB
  Browser["เบราว์เซอร์"]

  subgraph Edge["Traefik v3.7"]
    R1["app.localhost"]
    R2["api.localhost"]
    R3["docs.localhost"]
  end

  subgraph WebApp["apps/web · Next.js 16"]
    Proxy["proxy.ts<br/>i18n + route guard"]
    RSC["Server Components"]
    Client["Client Components<br/>TanStack Query"]
    ApiClient["lib/api-client<br/>fetch + zod parse"]
  end

  subgraph ApiApp["apps/api · NestJS 11"]
    Pipeline["middleware → guard → pipe<br/>→ interceptor → controller"]
    Modules["auth · users · health"]
    Prisma["PrismaService"]
  end

  subgraph Data["ชั้นข้อมูล"]
    PG[("PostgreSQL 18")]
    Redis[("Redis 8")]
  end

  Contracts["packages/contracts<br/>zod schemas"]

  Browser --> Edge
  R1 --> Proxy --> RSC --> Client --> ApiClient
  R2 --> Pipeline --> Modules --> Prisma --> PG
  ApiClient -->|Bearer JWT| R2
  Modules -.-> Redis
  R3 --> Docs["VitePress"]

  Contracts -.imports.-> ApiClient
  Contracts -.imports.-> Pipeline

  classDef unused fill:#fafafa,stroke:#bbb,stroke-dasharray:4 3
  class Redis unused
```

| ส่วน | หน้าที่ | รายละเอียด |
| --- | --- | --- |
| **apps/web** | UI ทั้งหมด, i18n, form validation, การเก็บ session | [Session ฝั่ง client](/frontend/auth-client) |
| **apps/api** | กฎธุรกิจ, การเข้าถึงข้อมูล, ออก token, บังคับสิทธิ์ | [ภาพรวม auth](/auth/overview) |
| **apps/docs** | สเปกและเอกสาร (ไม่ได้อยู่ใน runtime path) | — |
| **packages/contracts** | zod schema ของ request/response — สัญญาระหว่างสองแอป | [Contract-first](/conventions/contract-first) |
| **Traefik** | reverse proxy ผูก `*.localhost` เข้ากับแต่ละ service | [Container & routing](/architecture/containers) |
| **PostgreSQL** | ข้อมูลถาวรทั้งหมด เข้าถึงผ่าน Prisma เท่านั้น | [Data model](/architecture/data-model) |
| **Redis** | ยกขึ้นมาแล้วแต่ยังไม่มีโค้ดใช้ | [Roadmap](/start/roadmap) |

## เส้นทางของ request

request ที่ผู้ใช้ล็อกอินแล้วเรียกข้อมูล ผ่านมือ 6 ต่อ

```mermaid
sequenceDiagram
  autonumber
  participant B as เบราว์เซอร์
  participant T as Traefik
  participant W as Next.js
  participant A as NestJS
  participant P as Prisma
  participant D as Postgres

  B->>T: GET /th/settings/users
  T->>W: route: app.localhost
  W->>W: proxy.ts — เลือก locale + ตรวจ session
  W-->>B: HTML (RSC) + hydrate
  B->>T: GET /v1/users?page=1<br/>Authorization: Bearer …<br/>x-request-id: 0192…
  T->>A: route: api.localhost
  A->>A: guard (JWT) → guard (CASL) → zod pipe
  A->>P: prisma.user.findMany(accessibleBy(ability))
  P->>D: SELECT …
  D-->>P: rows
  P-->>A: models
  A-->>B: 200 + envelope<br/>x-request-id สะท้อนกลับ
```

รายละเอียดทีละขั้น รวมถึงเส้นทางตอน error อยู่ที่ [วงจรชีวิตของ request](/architecture/request-lifecycle)

## ขอบเขตและกฎ

| ขอบ | กฎ |
| --- | --- |
| web ↔ api | คุยกันด้วย REST + JSON เท่านั้น ห้าม import โค้ดข้ามกัน |
| ของที่ใช้ร่วมกัน | ต้องอยู่ใน `packages/contracts` และเป็น zod schema |
| การเข้าถึง DB | ผ่าน `PrismaService` เท่านั้น ห้ามเขียน SQL ตรง ๆ นอก Prisma |
| ระหว่างโมดูลใน api | เรียกผ่าน service ที่ export ไม่เรียก repository ข้ามโมดูล |
| สิทธิ์ | บังคับที่ฝั่ง server เสมอ UI แค่ซ่อนของ ไม่ใช่ตัวป้องกัน |
| error | ทุก error ที่ออกจาก api ต้องอยู่ในรูป envelope เดียวกัน |
| ทุก request | ต้องมี trace id และ log ทุกบรรทัดต้องแนบ trace id นั้น |

สามข้อสุดท้ายคือสิ่งที่ทำให้ระบบ debug ได้ — อ่าน [Error envelope](/conventions/errors) และ [Trace ID](/platform/trace-id)

## ทำไมเป็น modular monolith

deploy ชิ้นเดียว โค้ดแยกโมดูลชัด — ได้ขอบเขตที่ชัดโดยไม่ต้องแบก distributed transaction, service discovery และ debug ข้าม service ตั้งแต่วันแรก เมื่อโมดูลไหนโตจนต้องแยกจริง ๆ ขอบเขตที่วางไว้ทำให้แยกได้โดยไม่ต้องรื้อ

เหตุผลเต็มและทางเลือกที่ปฏิเสธอยู่ใน [ADR-0004](/adr/0004-modular-monolith)
