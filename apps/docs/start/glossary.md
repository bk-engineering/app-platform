---
title: อภิธานศัพท์
status: implemented
---

# อภิธานศัพท์

<Status value="implemented" />

คำศัพท์ที่ใช้ซ้ำ ๆ ทั่วทั้งเอกสารชุดนี้ เรียงตามหมวด ถ้าเจอคำที่ไม่คุ้นหน้าไหน กลับมาที่นี่ก่อน

## สถาปัตยกรรม & ข้ามระบบ

**SSOT (Single Source of Truth)**
เอกสารชุดนี้เอง — จุดเดียวที่นิยาม "ระบบควรทำงานยังไง" โค้ดต้องตามเอกสาร ไม่ใช่กลับกัน ดู [ADR-0015](/adr/0015-docs-as-bilingual-ssot)

**modular monolith**
deploy เป็นก้อนเดียว แต่โค้ดแบ่งโมดูลด้วยขอบเขตชัดเจนเหมือน microservices — ได้ความชัดเจนของขอบเขตโดยไม่ต้องแบก distributed transaction ตั้งแต่วันแรก ดู [ภาพรวมระบบ](/architecture/overview)

**contract**
zod schema ใน `packages/contracts` ที่ทั้ง `apps/web` และ `apps/api` import ร่วมกัน เป็นสัญญาว่าข้อมูลที่ส่งผ่าน REST หน้าตาเป็นยังไง ดู [Contract-first](/conventions/contract-first)

**envelope**
รูปร่างเดียวที่ error ทุกตัวจาก API ต้องอยู่ในนั้น (`code`, `message`, `traceId`, `timestamp`, `path`, `details[]`) ทำให้ client เขียน error handler ครั้งเดียวใช้ได้ทั้งระบบ ดู [Error envelope](/conventions/errors)

**trace id**
id เดียวต่อหนึ่ง request (รูปแบบ UUIDv7) ที่ปรากฏในทุกบรรทัด log ที่เกี่ยวข้องกับ request นั้น ตั้งแต่เบราว์เซอร์จนถึง SQL query ดู [Trace ID](/platform/trace-id)

**idempotency**
คุณสมบัติที่เรียกซ้ำกี่ครั้งก็ได้ผลเหมือนเดิม — `GET`/`PUT`/`DELETE` ควร idempotent โดยธรรมชาติ ส่วน `POST` ที่มีผลข้างเคียงร้ายแรง (เช่นเรียกซ้ำแล้วสร้างซ้ำ) ควรรับ header `idempotency-key` ดู [ข้อตกลงของ API](/conventions/api-conventions)

**rate limiting**
การจำกัดจำนวนครั้งที่เรียก endpoint ได้ในช่วงเวลาหนึ่ง ป้องกัน brute-force และการใช้งานเกินขอบเขต ตอบกลับด้วย `429` และ code `RATE_LIMIT_EXCEEDED` เมื่อเกิน ดู [Error code catalog](/reference/error-codes)

**presigned URL**
URL ที่มีลายเซ็นและวันหมดอายุในตัว ใช้ให้ client อัปโหลด/ดาวน์โหลดไฟล์ตรงกับที่เก็บ (เช่น S3) ได้โดยไม่ต้องผ่าน server เป็นตัวกลาง

**cache-aside**
แพทเทิร์นแคชที่แอปเช็ก cache ก่อน ถ้าไม่เจอค่อยอ่านจาก DB แล้วเขียนกลับเข้า cache — ต่างจาก write-through ตรงที่ cache ไม่ได้ update พร้อมกับ DB เสมอไป

## Authentication & authorization

**rotation**
กติกาที่ refresh token ใช้ได้แค่ครั้งเดียว — ทุกครั้งที่ใช้สำเร็จ token เดิมถูกทำเครื่องหมายว่าใช้แล้วและออกตัวใหม่แทน ดู [JWT & refresh rotation](/auth/tokens)

**reuse detection**
กลไกที่ตรวจจับว่ามีการใช้ refresh token ที่ถูก rotate ไปแล้ว — เป็นสัญญาณว่าโทเคนหลุดไปอยู่ในมือคนร้าย ระบบจะเพิกถอนทุก token ใน family เดียวกันทันที ดู [JWT & refresh rotation](/auth/tokens)

**RBAC (Role-Based Access Control)**
โมเดลสิทธิ์ที่ผูก permission เข้ากับ role แล้วผู้ใช้ถือ role แทนที่จะผูก permission ตรงกับ user — ชั้นข้อมูลของ RBAC อยู่ที่ [Role & permission model](/auth/rbac-model) ส่วนกลไกบังคับใช้จริงคือ CASL

**ability**
วัตถุที่ CASL สร้างขึ้นจาก permission ของผู้ใช้คนหนึ่ง ตอบคำถามได้สามแบบ: "ทำสิ่งนี้ได้ไหม" (`can`), "กรองแถวไหนดูได้บ้าง" (`accessibleBy`), และ "ส่งกฎอะไรให้ UI" ดู [CASL authorization](/auth/casl)

**CASL**
ไลบรารีที่ใช้ implement authorization — แปลง permission ในตาราง DB เป็น `ability` แล้วใช้ตรวจทั้งฝั่ง server (บังคับจริง) และฝั่ง UI (ซ่อนปุ่ม) จากกฎชุดเดียวกัน ดู [CASL authorization](/auth/casl)

## เอกสาร & กระบวนการ

**status badge**
ป้าย <Status value="implemented" inline /> / <Status value="in-progress" inline /> / <Status value="planned" inline /> ที่ทุกหน้าต้องมี บอกว่าเนื้อหาตรงกับโค้ดวันนี้แค่ไหน ดู [ความหมายของสถานะ](/reference/status-legend)

**ADR (Architecture Decision Record)**
เอกสารบันทึกการตัดสินใจเชิงสถาปัตยกรรมพร้อมเหตุผลและทางเลือกที่ถูกปฏิเสธ อยู่ใน section `adr/` แต่ละไฟล์แก้ไม่ได้หลังจากถูก merge — ถ้าเปลี่ยนใจต้องเขียน ADR ใหม่ที่ supersede ของเดิม
