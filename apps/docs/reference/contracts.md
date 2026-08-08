---
title: Contract schema catalog
status: in-progress
statusNote: schema ที่มีอยู่ตรงกับโค้ดจริง แต่ยังใช้แค่ฝั่ง api และยังขาด schema ที่สเปกอื่นอ้างถึง
---

# Contract schema catalog

<Status value="in-progress" note="schema ที่มีอยู่ครบตามด้านล่าง แต่ฝั่ง web ยังไม่ import และยังขาดบางไฟล์" />

ทุก schema ที่ export จริงจาก `packages/contracts/src` วันนี้ — วิธีใช้และกฎการแก้ schema อยู่ที่ [Contract-first](/conventions/contract-first) หน้านี้เป็นแค่ catalog ตรวจสอบได้กับ source

## `index.ts` — barrel

```ts
export * from "./common.schema";
export * from "./user.schema";
export * from "./auth.schema";
```

ทุกอย่างที่ import จาก `@app-platform/contracts` มาจากสามไฟล์นี้

## `common.schema.ts`

| ชื่อ | ชนิด | รูปร่าง |
| --- | --- | --- |
| `PaginationQuerySchema` | schema | `{ page: number (≥1, default 1), limit: number (1–100, default 20) }` — ทั้งสอง field ใช้ `z.coerce.number()` แปลง query string ให้อัตโนมัติ |
| `PaginationQuery` | type | `z.infer<typeof PaginationQuerySchema>` |
| `paginatedSchema(itemSchema)` | schema factory | คืน `z.object({ items: T[], total: number, page: number, limit: number })` — รับ item schema เป็น argument |

```ts
const PaginatedUserSchema = paginatedSchema(UserSchema);
// { items: User[], total: number, page: number, limit: number }
```

::: tip `paginatedSchema()` ยังไม่มี endpoint ไหนใช้จริง
ดูตารางท้ายหน้า — เป็น utility ที่พร้อมใช้ แต่ยังไม่มี controller ไหนคืนลิสต์แบบแบ่งหน้าเลย
:::

## `user.schema.ts`

| ชื่อ | ชนิด | รูปร่าง |
| --- | --- | --- |
| `UserSchema` | schema | `{ id: uuid, email: email, displayName: string (1–120), createdAt: ISO datetime }` — **ไม่มี** `passwordHash` เพราะเป็น shape สำหรับส่งออกให้ client |
| `User` | type | `z.infer<typeof UserSchema>` |
| `CreateUserSchema` | schema | `{ email: email, displayName: string (1–120), password: string (8–72) }` |
| `CreateUser` | type | `z.infer<typeof CreateUserSchema>` |
| `UpdateUserSchema` | schema | `CreateUserSchema.pick({ displayName: true }).partial()` — คือ `{ displayName?: string (1–120) }` |
| `UpdateUser` | type | `z.infer<typeof UpdateUserSchema>` |

`UpdateUserSchema` ประกอบต่อจาก `CreateUserSchema` แทนที่จะเขียน field ซ้ำ — ดู [Contract-first § ประกอบ schema ต่อ ๆ กัน](/conventions/contract-first) สำหรับแพทเทิร์นนี้

::: warning `UpdateUserSchema` ยังไม่มี endpoint ใช้
ไม่มี `PATCH /users/:id` ใน `UsersController` วันนี้ — schema พร้อมแต่ route ยังไม่ถูกเขียน ดู [API endpoint catalog](/reference/api-endpoints)
:::

## `auth.schema.ts`

| ชื่อ | ชนิด | รูปร่าง |
| --- | --- | --- |
| `TokenRequestSchema` | schema | `{ grant_type: "password" \| "refresh_token", username?: email, password?: string (8–72), refresh_token?: string }` + `.refine()` บังคับว่า `grant_type=password` ต้องมี `username`+`password`, `grant_type=refresh_token` ต้องมี `refresh_token` — ตาม OAuth2 password/refresh_token grant (RFC 6749) |
| `TokenRequest` | type | `z.infer<typeof TokenRequestSchema>` — field ที่ไม่ใช้กับ grant_type นั้นยังเป็น optional ใน type เพราะ `.refine()` ไม่ narrow union ให้ ต้อง non-null assert (`!`) ที่จุดใช้งานหลังผ่าน validate แล้ว |
| `TokenResponseSchema` | schema | `{ access_token: string, token_type: "bearer", expires_in: number, refresh_token: string }` — shape ตาม RFC 6749 §5.1 ไม่ใช่ `accessToken`/`refreshToken` แบบ camelCase |
| `TokenResponse` | type | `z.infer<typeof TokenResponseSchema>` |

::: tip ทำไมเปลี่ยนจาก `LoginSchema`/`AuthTokensSchema` เดิม
เดิม `/auth/login` กับ `/auth/refresh` เป็นสอง endpoint แยก รับ/คืน JSON แบบ camelCase อิสระ ไม่ตรง spec ไหน — เปลี่ยนมารวมเป็น `POST /auth/token` เดียวตาม OAuth2 grant flow เพื่อให้ Swagger UI ใช้ปุ่ม **Authorize → oauth2 (password)** ขอ token ให้อัตโนมัติได้ในตัว (ดู [OpenAPI / Swagger](/backend/openapi)) แลกกับ body ต้องเป็น `application/x-www-form-urlencoded` และ field ชื่อตาม RFC แทน camelCase
:::

## ใครใช้ schema พวกนี้จริง ๆ

| ฝั่ง | ใช้ยังไง |
| --- | --- |
| `apps/api` | ทุก DTO ของ `AuthController`/`UsersController` extend จาก `createZodDto(<Schema>)` ของ `nestjs-zod` — ดู `apps/api/src/auth/dto/login.dto.ts` และ `apps/api/src/users/dto/create-user.dto.ts` |
| `apps/web` | **ยังไม่ import schema พวกนี้เลย** — ฟอร์มฝั่ง web ยังไม่ validate ด้วย zod schema ร่วม ดู [Contract-first § ฝั่ง Web ใช้ยังไง](/conventions/contract-first) สำหรับรูปแบบที่ตั้งเป้าไว้ |

## Schema ที่สเปกอื่นอ้างถึงแต่ยังไม่มีในแพ็กเกจนี้

- `ErrorEnvelopeSchema`, `ErrorDetailSchema` — สเปกอยู่ที่ [Error envelope](/conventions/errors) แต่ไฟล์ `error.schema.ts` ยังไม่ถูกสร้างใน `packages/contracts/src`
- `AbilitySchema`/type ของ CASL rule — พูดถึงใน [CASL authorization](/auth/casl) ในชื่อ `packages/contracts/src/ability.schema.ts` แต่ยังไม่มีไฟล์นี้จริง

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| `error.schema.ts` สำหรับ error envelope | ยังไม่มีไฟล์ |
| `ability.schema.ts` สำหรับ CASL | ยังไม่มีไฟล์ |
| ฝั่ง web import และใช้ schema ตอน validate ฟอร์ม | ยังไม่มีการ import จาก `@app-platform/contracts` ใน `apps/web` เลย |
| `paginatedSchema()` ถูกใช้จริงในอย่างน้อยหนึ่ง endpoint | ยังไม่มี endpoint ไหนคืนลิสต์แบบแบ่งหน้า |
:::
