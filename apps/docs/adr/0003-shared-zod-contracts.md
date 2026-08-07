---
title: 0003 · zod contracts ที่แชร์กัน
status: implemented
---

# 0003 · zod contracts ที่แชร์กัน

<Status value="implemented" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-02
- **หมวด:** contracts

## บริบท

รูปร่างของ request/response ถูกใช้ในสามที่ — DTO ฝั่ง Nest, type ฝั่ง React, กฎ validate ของฟอร์ม ถ้าเขียนแยกกัน ทั้งสามจะเพี้ยนจากกันแน่นอน และเพี้ยนแบบเงียบ ๆ จนไปพังตอน runtime

## การตัดสินใจ

นิยามทุกสัญญาเป็น **zod schema ใน `packages/contracts` ที่เดียว** ทั้งสองแอปดึงไปใช้

- API แปลงเป็น DTO ด้วย `createZodDto()` ของ nestjs-zod ซึ่ง Swagger อ่านได้
- Web ใช้เป็น resolver ของ react-hook-form และ `.parse()` response ที่ขอบระบบ
- type มาจาก `z.infer` ไม่เขียน interface ซ้ำ

รายละเอียดการใช้งานอยู่ที่ [Contract-first](/conventions/contract-first)

## ทางเลือกที่พิจารณา

### class-validator + class-transformer (ค่ามาตรฐานของ Nest)
เป็นทางที่ Nest แนะนำและเอกสารเยอะกว่า แต่ decorator บน class ใช้ร่วมกับฝั่ง frontend ไม่ได้จริง — ต้องเขียนกฎ validate ซ้ำใน react-hook-form อยู่ดี ซึ่งคือปัญหาที่เรากำลังแก้

### tRPC
ได้ type safety ปลายถึงปลายโดยไม่ต้องมี schema กลาง แต่ผูก client กับ server แน่นเกินไป — Swagger หายไป, เรียกด้วย curl ไม่ได้, client ที่ไม่ใช่ TypeScript ต่อไม่ได้เลย

### สร้าง client จาก OpenAPI
ให้ API เป็นแหล่งความจริงแล้ว generate client ออกมา แต่โค้ดที่ generate ได้มักอ่านยาก และไม่ได้กฎ validate ฝั่ง client มาด้วย (ได้แค่ type) — ยังต้องเขียนกฎฟอร์มซ้ำ

### แชร์แค่ TypeScript type
เบาที่สุด แต่ type หายไปตอน runtime — ไม่ช่วยอะไรตรงจุดที่สำคัญที่สุดคือขอบระบบที่ข้อมูลจากภายนอกเข้ามา

## ผลที่ตามมา

**ได้:** นิยามที่เดียวได้ทั้ง type, DTO, resolver, และตัวตรวจ response · แก้ schema แล้ว `tsc` ไล่จนกว่าทั้งสองฝั่งจะตรง · กฎอย่าง `max(72)` ของ bcrypt บังคับพร้อมกันทั้งสองฝั่งฟรี

**เสีย:** ผูกกับ zod ทั้ง repo · `packages/contracts` ต้องรันได้ทั้งบน Node และเบราว์เซอร์ ใส่ของที่ผูกกับ platform ไม่ได้เลย · nestjs-zod เป็น dependency เพิ่มที่ต้องตามเวอร์ชันของ Nest

**ต้องทำต่อ:** `apps/web` ยังไม่ import contracts เลยแม้จะประกาศ dependency ไว้ · ต้องเพิ่ม `error.schema.ts` และ `ability.schema.ts`

## เมื่อไหร่ควรทบทวน

เมื่อมี client ภายนอกที่ไม่ใช่ TypeScript มาใช้ API — ตอนนั้น OpenAPI ที่ generate จาก zod ต้องกลายเป็นสัญญาหลัก และต้องเข้มงวดเรื่องเวอร์ชันมากกว่านี้
