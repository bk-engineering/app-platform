---
title: Error code catalog
status: planned
statusNote: ยังไม่มี error envelope ในโค้ด
---

# Error code catalog

<Status value="planned" />

`code` ทุกตัวที่ปรากฏใน [error envelope](/conventions/errors) ต้องอยู่ในตารางนี้ ถ้าไม่อยู่ = บั๊ก

::: danger error code เป็นส่วนหนึ่งของ API
client ตัดสินใจจาก `code` การเปลี่ยนความหมายของ code ที่มีอยู่คือ breaking change เหมือนกับการลบ field ถ้าความหมายเปลี่ยน ให้เพิ่ม code ใหม่ ไม่ใช่แก้ของเดิม
:::

## กฎการตั้งชื่อ

```
<NAMESPACE>_<เรื่อง>
```

| Namespace | ครอบคลุม |
| --- | --- |
| `AUTH_` | ยืนยันตัวตน — ใครเป็นใคร |
| `AUTHZ_` | สิทธิ์ — ทำอะไรได้ |
| `USER_` | โดเมนผู้ใช้ |
| `ROLE_` | โดเมนบทบาทและสิทธิ์ |
| `FILE_` | อัปโหลด/ดาวน์โหลด |
| `VALIDATION_` | รูปแบบข้อมูลผิด |
| `RESOURCE_` | ปัญหาทั่วไปของทรัพยากร ไม่ผูกโดเมน |
| `RATE_` | จำกัดอัตรา |
| `SYS_` | ระบบขัดข้อง |

UPPER_SNAKE_CASE เสมอ ไม่มีเลขต่อท้าย

## Authentication

| Code | HTTP | i18n key | โยนเมื่อ | client ควรทำ |
| --- | --- | --- | --- | --- |
| `AUTH_INVALID_CREDENTIALS` | 401 | `errors.AUTH_INVALID_CREDENTIALS` | อีเมลหรือรหัสผ่านผิด | โชว์ error ที่ฟอร์ม **ห้ามบอกว่าผิดตัวไหน** |
| `AUTH_TOKEN_MISSING` | 401 | `errors.AUTH_TOKEN_MISSING` | ไม่มี Bearer token | ส่งไปหน้า login |
| `AUTH_TOKEN_INVALID` | 401 | `errors.AUTH_TOKEN_INVALID` | ลายเซ็นผิดหรือรูปพัง | ล้าง session แล้วไป login |
| `AUTH_TOKEN_EXPIRED` | 401 | `errors.AUTH_TOKEN_EXPIRED` | access token หมดอายุ | **refresh แล้วยิงซ้ำ** |
| `AUTH_REFRESH_INVALID` | 401 | `errors.AUTH_REFRESH_INVALID` | refresh token ไม่รู้จัก/หมดอายุ/ถูกเพิกถอน | ไป login |
| `AUTH_REFRESH_REUSED` | 401 | `errors.AUTH_REFRESH_REUSED` | ใช้ token ที่ rotate ไปแล้ว — สงสัยว่าถูกขโมย | ไป login + แจ้งว่า session ทั้งหมดถูกยกเลิก |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | `errors.AUTH_EMAIL_NOT_VERIFIED` | ต้องยืนยันอีเมลก่อน | ไปหน้า "ตรวจอีเมลของคุณ" |
| `AUTH_ACCOUNT_INACTIVE` | 403 | `errors.AUTH_ACCOUNT_INACTIVE` | บัญชีถูกปิดใช้งาน | แจ้งให้ติดต่อผู้ดูแล |
| `AUTH_PASSWORD_NOT_SET` | 400 | `errors.AUTH_PASSWORD_NOT_SET` | ล็อกอินด้วยรหัสผ่านแต่บัญชีสมัครผ่าน Google | ชวนให้ใช้ปุ่ม Google |
| `AUTH_OAUTH_FAILED` | 400 | `errors.AUTH_OAUTH_FAILED` | flow ของ Google ล้มเหลว | กลับหน้า login พร้อมข้อความ |
| `AUTH_OAUTH_EMAIL_TAKEN` | 409 | `errors.AUTH_OAUTH_EMAIL_TAKEN` | อีเมลของ Google ตรงกับบัญชีที่ใช้รหัสผ่านอยู่ | ให้ล็อกอินด้วยรหัสผ่านก่อนแล้วค่อยผูก |

::: tip `AUTH_TOKEN_EXPIRED` ต้องแยกจาก `AUTH_TOKEN_INVALID`
เพราะสองอันนี้ทำให้ client ทำคนละอย่าง — `EXPIRED` = refresh เงียบ ๆ แล้วยิงใหม่, `INVALID` = ล้างทิ้งแล้วไป login ถ้ารวมเป็นอันเดียว ผู้ใช้จะถูกเตะออกทุก 15 นาที
:::

## Authorization

| Code | HTTP | i18n key | โยนเมื่อ | client ควรทำ |
| --- | --- | --- | --- | --- |
| `AUTHZ_FORBIDDEN` | 403 | `errors.AUTHZ_FORBIDDEN` | CASL ปฏิเสธ และผู้ใช้รู้อยู่แล้วว่าของมีอยู่ | โชว์ว่าไม่มีสิทธิ์ |
| `AUTHZ_INSUFFICIENT_ROLE` | 403 | `errors.AUTHZ_INSUFFICIENT_ROLE` | ต้องมี role ที่สูงกว่า | โชว์ว่าไม่มีสิทธิ์ |

::: tip เมื่อไหร่ตอบ 404 แทน 403
ถ้าการยืนยันว่า "ของชิ้นนี้มีอยู่" เป็นการรั่วข้อมูลเอง ให้ใช้ `RESOURCE_NOT_FOUND` แทน — ดู [ข้อตกลงของ API](/conventions/api-conventions)
:::

## ผู้ใช้

| Code | HTTP | i18n key | โยนเมื่อ |
| --- | --- | --- | --- |
| `USER_NOT_FOUND` | 404 | `errors.USER_NOT_FOUND` | ไม่พบ user id นั้น |
| `USER_EMAIL_TAKEN` | 409 | `errors.USER_EMAIL_TAKEN` | อีเมลถูกใช้แล้ว |
| `USER_PASSWORD_MISMATCH` | 400 | `errors.USER_PASSWORD_MISMATCH` | เปลี่ยนรหัสผ่านแต่รหัสเดิมผิด |
| `USER_PASSWORD_WEAK` | 422 | `errors.USER_PASSWORD_WEAK` | ไม่ผ่านนโยบายรหัสผ่าน |
| `USER_PASSWORD_REUSED` | 422 | `errors.USER_PASSWORD_REUSED` | รหัสใหม่เหมือนรหัสเดิม |
| `USER_CANNOT_DELETE_SELF` | 409 | `errors.USER_CANNOT_DELETE_SELF` | ผู้ดูแลลบบัญชีตัวเอง |
| `USER_LAST_ADMIN` | 409 | `errors.USER_LAST_ADMIN` | จะทำให้ระบบไม่เหลือผู้ดูแล |

## Role & permission

| Code | HTTP | i18n key | โยนเมื่อ |
| --- | --- | --- | --- |
| `ROLE_NOT_FOUND` | 404 | `errors.ROLE_NOT_FOUND` | ไม่พบ role |
| `ROLE_KEY_TAKEN` | 409 | `errors.ROLE_KEY_TAKEN` | key ซ้ำ |
| `ROLE_SYSTEM_IMMUTABLE` | 409 | `errors.ROLE_SYSTEM_IMMUTABLE` | แก้หรือลบ role ของระบบ (`isSystem`) |
| `ROLE_IN_USE` | 409 | `errors.ROLE_IN_USE` | ลบ role ที่ยังมีคนถืออยู่ |

## ยืนยัน / รีเซ็ต token

| Code | HTTP | i18n key | โยนเมื่อ |
| --- | --- | --- | --- |
| `TOKEN_INVALID` | 400 | `errors.TOKEN_INVALID` | token ยืนยัน/รีเซ็ตไม่รู้จัก |
| `TOKEN_EXPIRED` | 400 | `errors.TOKEN_EXPIRED` | เลย `expiresAt` |
| `TOKEN_ALREADY_USED` | 409 | `errors.TOKEN_ALREADY_USED` | `consumedAt` มีค่าแล้ว |

## ไฟล์

| Code | HTTP | i18n key | โยนเมื่อ |
| --- | --- | --- | --- |
| `FILE_TOO_LARGE` | 413 | `errors.FILE_TOO_LARGE` | เกินขนาดที่กำหนด |
| `FILE_TYPE_UNSUPPORTED` | 415 | `errors.FILE_TYPE_UNSUPPORTED` | MIME type ไม่อยู่ใน allowlist |
| `FILE_UPLOAD_FAILED` | 500 | `errors.FILE_UPLOAD_FAILED` | ที่เก็บไฟล์มีปัญหา |

## ทั่วไป

| Code | HTTP | i18n key | โยนเมื่อ |
| --- | --- | --- | --- |
| `VALIDATION_FAILED` | 422 | `errors.VALIDATION_FAILED` | zod ไม่ผ่าน — รายละเอียดอยู่ใน `details[]` |
| `RESOURCE_NOT_FOUND` | 404 | `errors.RESOURCE_NOT_FOUND` | ไม่พบทั่วไป หรือซ่อนไว้ด้วยเหตุผลด้านสิทธิ์ |
| `RESOURCE_CONFLICT` | 409 | `errors.RESOURCE_CONFLICT` | Prisma `P2002` ที่ไม่ได้ map เฉพาะเจาะจง |
| `RATE_LIMIT_EXCEEDED` | 429 | `errors.RATE_LIMIT_EXCEEDED` | เกิน throttle — มี header `Retry-After` |
| `SYS_DEPENDENCY_UNAVAILABLE` | 503 | `errors.SYS_DEPENDENCY_UNAVAILABLE` | DB หรือของที่พึ่งพาล่ม |
| `INTERNAL_ERROR` | 500 | `errors.INTERNAL_ERROR` | ทุกอย่างที่ไม่ได้จัดหมวด |
| `NETWORK_ERROR` | — | `errors.NETWORK_ERROR` | **สร้างฝั่ง client** เมื่อยิงไม่ถึงหรือ response ไม่เป็นรูป |

## code ของ validation ใน `details[]`

`details[].code` ใช้คนละ namespace เพราะผูกกับ field ไม่ใช่ทั้ง request แปลงจาก zod issue code

| zod issue | `details[].code` | ข้อความไทยที่แนะนำ |
| --- | --- | --- |
| `invalid_type` | `validation.invalid_type` | ชนิดข้อมูลไม่ถูกต้อง |
| `too_small` | `validation.too_small` | สั้นหรือน้อยเกินไป |
| `too_big` | `validation.too_big` | ยาวหรือมากเกินไป |
| `invalid_format` (email) | `validation.email` | รูปแบบอีเมลไม่ถูกต้อง |
| `invalid_format` (uuid) | `validation.uuid` | รหัสไม่ถูกต้อง |
| `invalid_enum_value` | `validation.enum` | ค่าที่เลือกไม่ถูกต้อง |
| `custom` | `validation.custom` | ข้อมูลไม่ถูกต้อง |

## เพิ่ม code ใหม่

1. ถามก่อนว่า code เดิมใช้ได้ไหม — catalog ที่บวมคือ catalog ที่ไม่มีใครอ่าน
2. เลือก namespace ให้ตรง
3. เพิ่มแถวในตารางนี้ **และ** ในเวอร์ชันอังกฤษ
4. เพิ่ม helper ใน `Errors` ของ `apps/api/src/common/errors/app.exception.ts`
5. เพิ่ม key ใน `apps/web/messages/th.json` **และ** `en.json`
6. ถ้า client ต้องทำอะไรพิเศษกับ code นี้ ให้เขียนไว้ในคอลัมน์ "client ควรทำ"

::: warning สถานะโค้ดปัจจุบัน
ยังไม่มี code ตัวไหนถูก implement — API ตอบรูปแบบ default ของ Nest (`{ statusCode, message, error }`) ตารางนี้คือสเปกที่ [error envelope](/conventions/errors) จะต้องทำตาม
:::
