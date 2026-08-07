---
title: 0006 · เก็บ token ใน httpOnly cookie
status: planned
---

# 0006 · เก็บ token ใน httpOnly cookie

<Status value="planned" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-07
- **หมวด:** auth

## บริบท

API คืน token ใน response body ฝั่ง web ต้องตัดสินใจว่าจะเก็บที่ไหน การเลือกนี้กำหนดว่าระบบเราจะอ่อนไหวต่อ XSS หรือ CSRF และกำหนดว่า Server Component จะดึงข้อมูลแทนผู้ใช้ได้หรือไม่

## การตัดสินใจ

**เก็บทั้ง access และ refresh token ใน httpOnly cookie ที่ตั้งโดย route handler ของ Next.js**

- เบราว์เซอร์ยิงไปที่ `/api/auth/*` (route handler ฝั่ง server) ไม่ยิง API ตรง
- route handler เรียก API แล้วแปลง token ที่ได้เป็น `Set-Cookie` ที่เป็น httpOnly
- **token ไม่เคยผ่านมือ JavaScript ในหน้าเว็บ**
- `refresh_token` ตั้ง `path=/api/auth/refresh` ให้ถูกส่งเฉพาะตอนขอ refresh
- กัน CSRF ด้วย `SameSite=Lax` + double-submit token

## ทางเลือกที่พิจารณา

### `localStorage`
เขียนง่ายที่สุดและไม่ต้องกังวลเรื่อง CSRF เลย แต่ **XSS ครั้งเดียวได้ token ไปถาวร** และ dependency ของ frontend ทุกตัวคือช่องทาง XSS ที่เป็นไปได้ นอกจากนี้ Server Component อ่านไม่ได้ ทำให้ prefetch ฝั่ง server ทำไม่ได้เลย

### เก็บ access ในหน่วยความจำ + refresh ใน httpOnly cookie
ปลอดภัยกว่า localStorage เพราะ access token หายไปเมื่อ refresh หน้า แต่ทุกครั้งที่โหลดหน้าใหม่ต้องยิง refresh ก่อนถึงจะดึงข้อมูลได้ ซึ่งทำให้เห็นหน้าเปล่าแวบหนึ่งเสมอ และ Server Component ยังอ่าน access token ไม่ได้อยู่ดี

### httpOnly cookie ที่ตั้งโดย API ตรง ๆ
ตัดชั้น route handler ออกได้ แต่ต้องให้ API กับ web อยู่โดเมนเดียวกัน (หรือใช้ `SameSite=None` ซึ่งอ่อนกว่ามาก) และทำให้ API ต้องรู้จักรายละเอียดของ client เว็บ ซึ่งขัดกับการที่ API ควรรองรับ client อื่นได้ด้วย

## ผลที่ตามมา

**ได้:** XSS ขโมย token ไม่ได้ · Server Component อ่าน cookie ได้ ทำให้ prefetch และ SSR ที่ต้องยืนยันตัวตนทำได้ · เบราว์เซอร์แนบ cookie ให้เอง · session อยู่รอดตอน refresh หน้าโดยไม่ต้องยิงอะไรก่อน

**เสีย:** ต้องกัน CSRF (SameSite + double-submit) · ต้องมีชั้น route handler ของ Next เพิ่มมาสำหรับทุก endpoint ของ auth · client ที่ไม่ใช่เบราว์เซอร์ยังต้องใช้ Bearer header (strategy จึงต้องอ่านได้ทั้งสองทาง) · debug ยากขึ้นนิดหน่อยเพราะดู token ใน devtools ไม่ได้

**ต้องทำต่อ:** สร้าง route handler `/api/auth/{login,logout,refresh}` · เพิ่ม CSRF token ใน `proxy.ts` · ให้ `JwtStrategy` อ่าน token จาก cookie ก่อนแล้วค่อย fallback ไป Bearer header

## เมื่อไหร่ควรทบทวน

เมื่อมี native mobile app มาใช้ API เดียวกัน — cookie ไม่เหมาะกับ client แบบนั้น ตอนนั้นให้ mobile ใช้ Bearer + secure storage ของ OS ส่วนเว็บยังใช้ cookie ต่อ ซึ่ง strategy ที่รองรับสองทางอยู่แล้วทำให้ไม่ต้องเปลี่ยนอะไรที่ API
