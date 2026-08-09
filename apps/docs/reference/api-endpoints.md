---
title: API endpoint catalog
status: in-progress
statusNote: endpoint จริงมีน้อย ไม่มี /v1 prefix — แต่ guard/CASL/error envelope ทำงานจริงแล้วในทุก endpoint ที่มี
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
| `POST` | `/auth/token` | ไม่ต้อง (`@Public()`) | `application/x-www-form-urlencoded` ตาม `TokenRequestSchema` — `grant_type=password` ต้องมี `username`+`password`, `grant_type=refresh_token` ต้องมี `refresh_token` (validate ด้วย `.refine()`) | `TokenResponseSchema` — `{ access_token, token_type: "bearer", expires_in, refresh_token }` | endpoint เดียวรวม login + refresh ตาม OAuth2 password/refresh_token grant (RFC 6749) เพื่อให้ Swagger UI ใช้ **Authorize → OAuth2 (password)** แล้ว auto-refresh ได้ในตัว โยน `401 AUTH_INVALID_CREDENTIALS` ถ้า credentials ผิด, `422 VALIDATION_FAILED` ถ้า field ไม่ครบตาม grant_type, `401 AUTH_REFRESH_INVALID`/`AUTH_REFRESH_REUSED` ถ้า refresh token ใช้ไม่ได้ — **rotate จริงทุกครั้ง** พร้อม reuse detection ดู [JWT & refresh rotation](/auth/tokens) |
| `GET` | `/auth/me` | ต้อง auth | — | `{ user: { id, email }, rules: RawRule[] }` | คืน CASL ability rules ดิบของผู้ใช้ที่ login อยู่ ดู [CASL](/auth/casl) |

## Users

`UsersController` — mount ที่ `/users`

| Method | Path | Auth | Request body | Response | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | ต้อง auth + `@CheckPolicies(can('create','User'))` | `CreateUserSchema` — `{ email, displayName, password }` | `UserSchema` (ไม่มี `passwordHash`) | ตาม [ตารางสิทธิ์](/auth/rbac-model) มีแค่ `manager`/`admin` สร้างได้ — `403 AUTHZ_FORBIDDEN` ถ้าไม่ใช่, `409 USER_EMAIL_TAKEN` ถ้าอีเมลซ้ำ |
| `GET` | `/users/:id` | ต้อง auth | — | `UserSchema` (ไม่มี `passwordHash`) | ตรวจสิทธิ์ระดับแถวด้วย `ability.can('read', subject('User', user))` — `member` เห็นแค่ตัวเอง คนอื่นได้ `404 USER_NOT_FOUND` (ไม่ใช่ `403` เพื่อไม่ยืนยันว่า id มีอยู่จริง) |

response ของทั้งสอง endpoint ตัด `passwordHash` ออกด้วยฟังก์ชัน `toPublicUser()` ใน `UsersService` ก่อนส่งกลับเสมอ ทุก endpoint ที่พังตอบเป็น [error envelope](/conventions/errors) เดียวกันหมด มี `code`/`traceId` เสมอ

## Health

`HealthController` — mount ที่ `/health`

| Method | Path | Auth | Request body | Response | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health` | ไม่ต้อง | — | `{ status: "ok", checkedAt: <ISO datetime> }` | ติด `@ApiExcludeController()` — **ไม่โผล่ใน Swagger UI** เป็น liveness check แบบ static ไม่ได้เช็ก DB/Redis จริง |

## สรุปตาราง auth requirement

| Guard | ใช้ที่ไหน | ทำอะไร |
| --- | --- | --- |
| `@Public()` (ข้าม guard ทั้งคู่) | `POST /auth/token`, `GET /health` | เปิด public ตั้งใจ |
| `JwtAuthGuard` + `PoliciesGuard` (global ทั้งคู่ผ่าน `APP_GUARD`) | ทุก route ที่เหลือ (`GET /auth/me`, `POST /users`, `GET /users/:id`) | ต้องมี `Authorization: Bearer <access_token>` ที่ valid (bearer scheme `access-token` หรือ oauth2 password flow) แล้วต่อด้วยเช็ก [CASL/สิทธิ์](/auth/rbac-model) จริง — ไม่ใช่แค่เช็กว่า login อยู่ |

## ที่สเปกต้องการแต่ยังไม่มี endpoint จริง

รายการ endpoint ที่หน้าเอกสารอื่นพูดถึงแต่ controller ยังไม่มี — อย่าเชื่อว่ามีอยู่จนกว่าจะเช็ก controller เอง

- `POST /auth/logout`, `POST /auth/revoke` — เพิกถอน refresh token family เดียว ([JWT & refresh rotation](/auth/tokens)) — OAuth2 มีท่ามาตรฐานสำหรับ revoke คือ `POST /auth/revoke` (RFC 7009) ถ้าจะตาม spec ให้ครบ
- `POST /auth/google`, `GET /auth/google/callback` — Google OAuth ([สมัครสมาชิก](/auth/signup))
- `POST /auth/verify-email`, `POST /auth/resend-verification` ([ยืนยันอีเมล](/auth/email-verification))
- `POST /auth/forgot-password`, `POST /auth/reset-password` ([ลืมรหัสผ่าน](/auth/forgot-password))
- `GET /users`, `PATCH /users/:id`, `DELETE /users/:id` — CRUD ที่เหลือของ users ยังไม่มี route (field-level update permission ใน [RBAC](/auth/rbac-model) จึงยังพิสูจน์ไม่ได้จากโค้ดจริง)

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| ทุก route ธุรกิจขึ้นต้น `/v1` | ไม่มี prefix เลย |
| `POST /users` ต้องผ่าน guard ที่ตั้งใจ | ✅ ต้อง auth + `create User` permission (manager ขึ้นไป) |
| refresh token rotation | ✅ rotate จริงทุกครั้ง พร้อม reuse detection |
| error ทุกตัวเป็น envelope เดียวกัน | ✅ `AllExceptionsFilter` |
| CRUD ครบของ `/users` | มีแค่ create กับ read เดี่ยว |
| response แบบ paginated (`paginatedSchema()`) | ยังไม่มี endpoint ไหนคืนลิสต์เลย |
:::
