---
title: 0005 · JWT + refresh rotation
status: planned
---

# 0005 · JWT + refresh rotation

<Status value="planned" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-07
- **หมวด:** auth

## บริบท

โค้ดปัจจุบันออก access token และ refresh token เป็น JWT ทั้งคู่ โดยที่ `refresh()` แค่ verify แล้วเซ็นใหม่ ผลคือ **refresh token ที่หลุดใช้ได้ไม่จำกัดจนหมดอายุ 7 วัน** เพิกถอนไม่ได้ ไม่มี logout จริง และเปลี่ยนรหัสผ่านก็ไม่ตัด session

## การตัดสินใจ

**access token เป็น JWT อายุสั้น + refresh token เป็น opaque token ที่มี state และ rotate ทุกครั้ง**

- access token: JWT อายุ 15 นาที มี `sub`, `email`, `roles`, `jti`, `issuer`, `audience` — verify แบบไร้ state
- refresh token: random 256 บิต (ไม่ใช่ JWT) เก็บ SHA-256 ในตาราง `RefreshToken`
- ทุกครั้งที่ refresh สำเร็จ ตัวเก่าถูกทำเครื่องหมายว่าใช้แล้ว และออกตัวใหม่ใน `familyId` เดิม
- **ใช้ token ที่ rotate ไปแล้ว = เพิกถอนทั้ง family** และแจ้งผู้ใช้ทางอีเมล

รายละเอียดที่ [JWT & refresh rotation](/auth/tokens)

## ทางเลือกที่พิจารณา

### JWT ล้วน ไม่มี state (แบบที่เป็นอยู่)
เร็วที่สุด ไม่แตะ DB เลย แต่เพิกถอนไม่ได้เลย ซึ่งหมายความว่า logout เป็นแค่ภาพลวง และการรีเซ็ตรหัสผ่านไม่ได้ตัดคนที่ขโมย session ไปแล้ว — ยอมรับไม่ได้

### Session ในฝั่ง server ทั้งหมด (opaque token + Redis)
เพิกถอนง่ายที่สุด แต่ต้องแตะ store ทุก request ซึ่งทำให้ API ขึ้นกับ Redis ตลอดเวลา และเสีย latency ทุกครั้ง

### Refresh token ที่มี state แต่ไม่ rotate
เพิกถอนได้ แต่ *ตรวจจับ* การขโมยไม่ได้ ถ้าคนร้ายก๊อป token ไปแล้วใช้ควบคู่กับเจ้าของ จะไม่มีสัญญาณอะไรเลยจนกว่าจะมีคนสังเกตเห็นเอง

### Rotation + reuse detection (ที่เลือก)
ได้ทั้งความเร็วของ JWT ในเส้นทางที่ใช้บ่อยที่สุด (ทุก API call) และความสามารถในการเพิกถอน + ตรวจจับในเส้นทางที่นาน ๆ ครั้ง (ทุก 15 นาที) แลกกับความซับซ้อนที่จัดการได้

## ผลที่ตามมา

**ได้:** logout ทำงานจริง · เปลี่ยนรหัสผ่านตัดทุก session · ตรวจจับการขโมย token ได้อัตโนมัติ · ผู้ใช้ดูและยกเลิก session รายเครื่องได้

**เสีย:** ตาราง `refresh_tokens` โตเรื่อย ๆ ต้องมีงานกวาด · การ refresh ต้องอยู่ใน transaction · **ฝั่ง client บังคับต้องทำ single-flight** ไม่งั้น request ที่ยิงพร้อมกันจะไป trigger reuse detection แล้วเตะผู้ใช้ออก · reuse detection มี false positive ได้ในสภาพเครือข่ายแย่ ๆ

**ต้องทำต่อ:** สร้างตาราง `RefreshToken` · เขียน `RefreshTokenService` · แยก `AUTH_TOKEN_EXPIRED` ออกจาก `AUTH_TOKEN_INVALID` ใน guard · ทำ single-flight ฝั่ง client ([Session ฝั่ง client](/frontend/auth-client)) · เพิ่มงานกวาดข้อมูลเก่า

## เมื่อไหร่ควรทบทวน

ถ้า false positive ของ reuse detection ทำให้ผู้ใช้เดือดร้อนบ่อย (เห็นได้จากอัตรา `AUTH_REFRESH_REUSED` ที่สูงผิดปกติ) ให้พิจารณาช่วงผ่อนผันสั้น ๆ ที่ยอมให้ใช้ token เดิมซ้ำได้ภายในไม่กี่วินาทีหลัง rotate — แต่นั่นคือการลดความสามารถในการตรวจจับลง ต้องชั่งน้ำหนักด้วยข้อมูลจริง
