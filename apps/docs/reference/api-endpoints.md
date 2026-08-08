---
title: API endpoint catalog
status: in-progress
statusNote: endpoint จริงมีน้อย ไม่มี /v1 prefix และ POST /users ยังไม่มี guard
---

# API endpoint catalog

<Status value="in-progress" />

ทุก endpoint ที่มีอยู่จริงใน `apps/api` วันนี้ — คนละหน้ากับ [ข้อตกลงของ API](/conventions/api-conventions) ที่เป็นกติกาทั่วไป หน้านี้คือรายการจริง ตรวจสอบได้กับ controller

::: warning ไม่มี `/v1` prefix ในโค้ดวันนี้
[ข้อตกลงของ API](/conventions/api-conventions) กำหนดให้ทุก route ธุรกิจขึ้นต้นด้วย `/v1` แต่ `app.setGlobalPrefix("v1")` ยังไม่ถูกเรียกใน `main.ts` — path จริงด้านล่างจึง**ไม่มี** `/v1` ตารางนี้ระบุ path ตามที่โค้ดตอบจริง ไม่ใช่ตามสเปก
:::

## Auth

`AuthController` — mount ที่ `/auth`

| Method | Path | Auth | Request body | Response | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | ไม่ต้อง | `LoginSchema` — `{ email, password }` | `AuthTokensSchema` — `{ accessToken, refreshToken }` | โยน `401` ถ้า email/password ผิด (ไม่บอกว่าผิดตัวไหน) |
| `POST` | `/auth/refresh` | ไม่ต้อง (ใช้ refresh token แทน) | `RefreshTokenSchema` — `{ refreshToken }` | `AuthTokensSchema` | verify แล้ว re-sign ทันที **ไม่มี rotation** — token เดิมยังใช้ซ้ำได้ ดู [JWT & refresh rotation](/auth/tokens) |

## Users

`UsersController` — mount ที่ `/users`

| Method | Path | Auth | Request body | Response | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | **ไม่มี guard เลย** | `CreateUserSchema` — `{ email, displayName, password }` | `UserSchema` (ไม่มี `passwordHash`) | 🚨 ใครก็สร้างบัญชีได้ตอนนี้ — ดู [Roadmap ข้อ 1](/start/roadmap) และ [สมัครสมาชิก](/auth/signup) |
| `GET` | `/users/:id` | `JwtAuthGuard` + `@ApiBearerAuth()` | — | `UserSchema` (ไม่มี `passwordHash`) | `404` ถ้าไม่พบ id |

response ของทั้งสอง endpoint ตัด `passwordHash` ออกด้วยฟังก์ชัน `toPublicUser()` ใน `UsersService` ก่อนส่งกลับเสมอ

## Health

`HealthController` — mount ที่ `/health`

| Method | Path | Auth | Request body | Response | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health` | ไม่ต้อง | — | `{ status: "ok", checkedAt: <ISO datetime> }` | ติด `@ApiExcludeController()` — **ไม่โผล่ใน Swagger UI** เป็น liveness check แบบ static ไม่ได้เช็ก DB/Redis จริง |

## สรุปตาราง auth requirement

| Guard | ใช้ที่ไหน | ทำอะไร |
| --- | --- | --- |
| ไม่มี guard | `POST /auth/login`, `POST /auth/refresh`, `GET /health`, **`POST /users`** | เปิด public ทั้งหมด — สาม endpoint แรกตั้งใจ ตัวสุดท้ายไม่ได้ตั้งใจ |
| `JwtAuthGuard` | `GET /users/:id` | ต้องมี `Authorization: Bearer <accessToken>` ที่ valid ยังไม่เช็ก [CASL/สิทธิ์](/auth/rbac-model) — เช็กแค่ว่า login อยู่ ไม่เช็กว่าดู user คนอื่นได้ไหม |

## ที่สเปกต้องการแต่ยังไม่มี endpoint จริง

รายการ endpoint ที่หน้าเอกสารอื่นพูดถึงแต่ controller ยังไม่มี — อย่าเชื่อว่ามีอยู่จนกว่าจะเช็ก controller เอง

- `POST /auth/logout` — เพิกถอน refresh token family เดียว ([JWT & refresh rotation](/auth/tokens))
- `POST /auth/google`, `GET /auth/google/callback` — Google OAuth ([สมัครสมาชิก](/auth/signup))
- `POST /auth/verify-email`, `POST /auth/resend-verification` ([ยืนยันอีเมล](/auth/email-verification))
- `POST /auth/forgot-password`, `POST /auth/reset-password` ([ลืมรหัสผ่าน](/auth/forgot-password))
- `GET /users`, `PATCH /users/:id`, `DELETE /users/:id` — CRUD ที่เหลือของ users ยังไม่มี route

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| ทุก route ธุรกิจขึ้นต้น `/v1` | ไม่มี prefix เลย |
| `POST /users` ต้องผ่าน signup flow ที่ตั้งใจ (มี guard หรือ rate limit) | เปิด public 100% |
| refresh token rotation | `refresh()` แค่ verify แล้ว re-sign |
| CRUD ครบของ `/users` | มีแค่ create กับ read เดี่ยว |
| response แบบ paginated (`paginatedSchema()`) | ยังไม่มี endpoint ไหนคืนลิสต์เลย |
:::
