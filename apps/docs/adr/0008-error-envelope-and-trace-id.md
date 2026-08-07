---
title: 0008 · error envelope + trace id
status: planned
---

# 0008 · error envelope + trace id

<Status value="planned" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-07
- **หมวด:** ข้ามระบบ

## บริบท

ตอนนี้ API ตอบ error ด้วยรูปแบบ default ของ Nest (`{ statusCode, message, error }`) ซึ่ง `message` เป็นได้ทั้ง string และ array ขึ้นกับว่าใครโยน ทำให้ฝั่ง client ต้องเดา และไม่มีอะไรผูก error ที่ผู้ใช้เห็นเข้ากับ log ฝั่ง server เลย เวลาผู้ใช้แจ้งว่า "มันขึ้น error" เราไม่มีทางหาว่าเกิดอะไรขึ้น

## การตัดสินใจ

สองอย่างที่ต้องมาคู่กัน

**1. Error envelope เดียวทั้งระบบ** — ทุก error ผ่าน `AllExceptionsFilter` จุดเดียว แล้วออกมาเป็น

```ts
{ code, message, traceId, timestamp, path, details[] }
```

`code` มาจาก [catalog](/reference/error-codes) และถือเป็นส่วนหนึ่งของ API ที่เปลี่ยนความหมายไม่ได้

**2. Trace ID ที่ไหลผ่านทุกชั้น** — UUIDv7 ใน header `x-request-id` เก็บใน `AsyncLocalStorage` แนบทุกบรรทัด log รวมถึง query ของ Prisma ปรากฏใน envelope และแสดงบน UI พร้อมปุ่มคัดลอก

รายละเอียดที่ [Error envelope](/conventions/errors) และ [Trace ID](/platform/trace-id)

## ทำไมสองเรื่องนี้อยู่ ADR เดียวกัน

แยกกันแล้วแต่ละอันได้ครึ่งเดียว — envelope ที่ไม่มี trace id ทำให้ client จัดการ error ได้แต่เราหา log ไม่เจอ ส่วน trace id ที่ไม่มี envelope ทำให้เรามี id ที่ไม่มีทางไปถึงมือผู้ใช้ **คุณค่าเกิดตอนที่ผู้ใช้ก๊อป trace id มาให้แล้วเราค้น log เจอทันที** ซึ่งต้องมีทั้งสองอย่าง

## ทางเลือกที่พิจารณา

### ปล่อยรูปแบบ default ของ Nest
ไม่ต้องทำอะไร แต่รูปร่างไม่แน่นอน ไม่มี code ที่เสถียร ไม่มีทางผูกกับ log

### RFC 7807 (Problem Details)
เป็นมาตรฐาน มี `type`, `title`, `status`, `detail`, `instance` แต่ `type` เป็น URI ซึ่งเกินความจำเป็นสำหรับระบบเดียว และไม่มีที่สำหรับ error ระดับ field ที่เราต้องใช้ผูกกลับเข้าฟอร์ม รูปแบบของเราเป็นแนวคิดเดียวกันแต่ตรงกับความต้องการมากกว่า

### OpenTelemetry ตั้งแต่แรก
เป็นปลายทางที่ถูกต้อง แต่ต้องมี collector, backend, และ instrumentation ทั้งชุด — เกินความจำเป็นสำหรับ boilerplate `x-request-id` แบบเรียบง่ายให้คุณค่า 80% ด้วยแรง 5% และอัปเกรดไป `traceparent` ทีหลังได้โดยไม่ต้องแก้โค้ดที่เรียกใช้

### ส่ง trace id ผ่าน argument ของฟังก์ชัน
ชัดเจนและตามรอยได้ง่าย แต่ต้องเติม parameter ให้ทุกฟังก์ชันตลอดทาง `AsyncLocalStorage` ทำให้ code ที่ไม่เกี่ยวไม่ต้องรู้จัก trace id เลย

## ผลที่ตามมา

**ได้:** ฝั่ง client เขียน handler ครั้งเดียวใช้ทั้งระบบ · `code` แปลเป็นข้อความในภาษาผู้ใช้ได้ · `details[]` ผูกกลับเข้าช่องกรอกได้ตรง ๆ · จาก error ที่ผู้ใช้เห็นถึง log ของ SQL ใช้คำสั่ง grep เดียว · ไม่มีข้อความภายในหลุดออกไป

**เสีย:** ต้องมี `AllExceptionsFilter`, `TraceIdMiddleware`, `AsyncLocalStorage` เพิ่ม · **ลำดับของ middleware สำคัญมาก** — trace middleware ต้องมาก่อน pino ไม่งั้นได้ `no-trace` ทั้งหมด · error code ทุกตัวต้องอยู่ใน catalog และแปลทั้งสองภาษา · `AsyncLocalStorage` มี overhead เล็กน้อย

**ต้องทำต่อ:** เพิ่ม `error.schema.ts` ใน contracts · เขียน filter + middleware · ตั้ง `genReqId` และ `redact` ของ pino · เพิ่ม namespace `errors` ใน `messages/{th,en}.json` · แสดง trace id พร้อมปุ่มคัดลอกบน UI

## เมื่อไหร่ควรทบทวน

เมื่อระบบมีมากกว่าหนึ่ง service หรือเมื่อต้องต่อกับ APM — ตอนนั้นย้ายไป W3C `traceparent` โดยยังรับ `x-request-id` ต่อ ค่าที่ `getTraceId()` คืนยังเป็นตัวเดียวกัน โค้ดที่เรียกใช้จึงไม่ต้องเปลี่ยน
