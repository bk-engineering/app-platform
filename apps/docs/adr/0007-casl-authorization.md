---
title: 0007 · CASL เป็นเครื่องมือ authorization
status: planned
---

# 0007 · CASL เป็นเครื่องมือ authorization

<Status value="planned" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-07
- **หมวด:** auth

## บริบท

ตอนนี้ระบบมีแค่ authentication — ล็อกอินแล้วทำได้ทุกอย่าง (`GET /users/:id` คืนใครก็ได้ให้ผู้ใช้คนใดก็ได้) เราต้องการสิทธิ์แบบ role พร้อมกฎระดับแถว ("แก้ได้เฉพาะของตัวเอง") และระดับ field ("manager แก้ user ได้แต่แก้ role ไม่ได้") และต้องใช้ตรรกะชุดเดียวกันทั้งการบังคับที่ server และการซ่อนปุ่มที่ UI

## การตัดสินใจ

ใช้ **`@casl/ability` + `@casl/prisma`** เป็นเครื่องมือ authorization ตัวเดียวของระบบ

- กฎเก็บเป็นแถวในตาราง `Permission` ที่โครงสร้างตรงกับ `RawRule` ของ CASL แบบ 1:1
- `AbilityFactory.forUser()` สร้าง ability จาก role ของผู้ใช้ พร้อมแทน `${user.id}` ใน conditions
- `PoliciesGuard` บังคับที่ระดับ endpoint
- `accessibleBy(ability)` ประกอบเข้ากับ `where` ของ Prisma ทุก query
- `GET /v1/auth/me` ส่ง `ability.rules` ไปให้ UI ประกอบกลับด้วย `createMongoAbility`

รายละเอียดที่ [CASL](/auth/casl)

## ทางเลือกที่พิจารณา

### เช็ค role ตรง ๆ (`if (user.role !== "admin")`)
ไม่ต้องพึ่งอะไรเลย แต่พังทันทีที่เจอคำว่า "ของตัวเอง" — เงื่อนไขจะซ้อนกันจนอ่านไม่ออกภายในไม่กี่เดือน และการซ่อนปุ่มบน UI ต้องเขียนตรรกะเดียวกันซ้ำอีกรอบเป็น TypeScript ฝั่ง client แล้วสองฝั่งจะเพี้ยนกัน

### Guard + decorator ของ Nest ที่เขียนเอง
ควบคุมได้เต็มที่ ไม่มี dependency เพิ่ม แต่สุดท้ายจะกลายเป็นการเขียน CASL ขึ้นมาเองแบบที่แย่กว่า และไม่ได้ `accessibleBy` ที่แปลงกฎเป็น SQL ให้ ซึ่งเป็นส่วนที่ยากที่สุดและสำคัญที่สุด

### Open Policy Agent / Cedar
ทรงพลังมาก แยกนโยบายออกจากแอปได้สมบูรณ์ แต่ต้องรัน service เพิ่มหรือฝัง WASM, ต้องเรียนภาษา policy ใหม่, และ **แปลงนโยบายเป็น `WHERE` ของฐานข้อมูลไม่ได้** ซึ่งเป็นสิ่งที่เราต้องการที่สุด เหมาะกับองค์กรที่มีหลาย service ไม่ใช่ modular monolith เดียว

### Prisma row-level security ผ่าน Postgres RLS
บังคับที่ระดับฐานข้อมูลจึงเลี่ยงไม่ได้เลย แต่นโยบายเขียนเป็น SQL ซึ่งเอาไปใช้ที่ UI ไม่ได้, ทดสอบยาก, และต้องส่ง user context ผ่าน session variable ของ connection ซึ่งเข้ากับ connection pool ได้ไม่ดี

## ผลที่ตามมา

**ได้:** ตรรกะสิทธิ์ชุดเดียวใช้ทั้ง server และ UI · `accessibleBy` กรองที่ระดับ SQL ไม่ใช่กรองในหน่วยความจำ · กฎเป็นข้อมูล ทำให้มีหน้าจอแก้สิทธิ์ได้ · ability เป็นตรรกะบริสุทธิ์ เทสง่ายมาก

**เสีย:** `conditions` เป็น JSON จาก DB ที่ป้อนเข้าเครื่องมือประเมินสิทธิ์ — **ต้องตรวจด้วย zod ก่อนใช้เสมอ** · การลืมใส่ `accessibleBy` ในบาง query = รั่วที่เทสจับไม่ได้ · `forUser()` ยิง DB ทุก request ถ้าไม่แคช และการแคชสิทธิ์เป็นเรื่องที่พลาดไม่ได้ · ทีมต้องเรียนแนวคิด action/subject/conditions

**ต้องทำต่อ:** ติดตั้ง `@casl/ability`, `@casl/prisma`, `@casl/react` · สร้างตาราง `Permission`/`Role` · เขียน `AbilityFactory` + `PoliciesGuard` · **พิจารณาทำ Prisma client extension ที่แทรก `accessibleBy` อัตโนมัติ** เพื่อกันการลืม · เขียนเทสให้ทุกแถวในตารางสิทธิ์ โดยเฉพาะแถวที่เป็นการปฏิเสธ

## เมื่อไหร่ควรทบทวน

เมื่อระบบกลายเป็น multi-tenant — ตอนนั้นทุกกฎต้องมีเงื่อนไข `tenantId` และควรบังคับด้วยเครื่องมือ ไม่ใช่พึ่งว่าทุกคนจะจำใส่ ให้ทำผ่าน Prisma extension ที่บังคับ tenant scope ตั้งแต่ชั้นล่างสุด แทนที่จะพึ่ง CASL อย่างเดียว
