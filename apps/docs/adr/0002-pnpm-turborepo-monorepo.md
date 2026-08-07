---
title: 0002 · pnpm workspaces + Turborepo
status: implemented
---

# 0002 · pnpm workspaces + Turborepo

<Status value="implemented" />

- **สถานะ:** accepted
- **วันที่:** 2026-08-02
- **หมวด:** monorepo

## บริบท

web, API และเอกสารต้องแชร์ type และสัญญาข้อมูลกัน ถ้าแยก repo จะเกิดปัญหาคลาสสิก — เปลี่ยน API แล้วต้องรอ publish package รอ bump version รอ merge อีกฝั่ง ระหว่างนั้นทั้งสองฝั่งไม่ตรงกันและไม่มีอะไรจับได้

## การตัดสินใจ

ใช้ **pnpm workspaces** จัดการ dependency และ **Turborepo** จัดการการรัน task

- `pnpm-workspace.yaml` ประกาศ `apps/*` และ `packages/*`
- package ในเครือผูกกันด้วย `workspace:*` เห็น source ตัวจริงเสมอ
- `turbo.json` นิยาม `dev`, `build`, `lint`, `test`, `clean` พร้อมลำดับ dependency

## ทางเลือกที่พิจารณา

### npm / yarn workspaces
ทำได้เหมือนกัน แต่ `node_modules` แบบ hoisted ทำให้เรียก dependency ที่ไม่ได้ประกาศไว้ได้โดยไม่มีใครเตือน (phantom dependency) แล้วไปพังตอน build จริง — pnpm ใช้ symlink ที่เข้มงวด เรียกได้เฉพาะที่ประกาศไว้

### Nx
ความสามารถครบกว่ามาก มี generator และ dependency graph แต่แลกมาด้วย config ที่ต้องเรียนรู้เยอะและการผูกติดที่แน่นกว่า Turborepo ทำสิ่งที่เราต้องการ (cache + ลำดับ task) ด้วย config 30 บรรทัด

### หลาย repo + package ที่ publish จริง
ให้ขอบเขตชัดที่สุด แต่แลกกับ overhead ที่หนักมากสำหรับทีมขนาดนี้ และทำให้การเปลี่ยนสัญญาแบบ atomic เป็นไปไม่ได้ — ซึ่งขัดกับ [ADR-0003](/adr/0003-shared-zod-contracts) โดยตรง

## ผลที่ตามมา

**ได้:** เปลี่ยนสัญญาข้ามทั้งสองแอปได้ใน commit เดียว · `pnpm build` จับความไม่ตรงกันทันที · cache ของ Turbo ทำให้ CI ไม่ต้อง build ใหม่ทั้งหมด · ประหยัดดิสก์จาก store ของ pnpm

**เสีย:** ต้อง `transpilePackages` สำหรับ `@app-platform/contracts` เพราะไม่มีขั้นตอน build · pnpm 11 บล็อก postinstall เป็นค่าเริ่มต้น ต้องประกาศ `allowBuilds` เอง · `node_modules` แบบ symlink ต้องใช้ named volume ใน Docker

**ต้องทำต่อ:** ตั้ง remote cache ของ Turbo ตอนทำ CI · เพิ่ม task `typecheck` ที่ยังไม่มี

## เมื่อไหร่ควรทบทวน

เมื่อจำนวน package เกิน ~15 อัน หรือเมื่อ build ทั้ง repo นานเกิน 5 นาทีแม้จะมี cache — ตอนนั้น graph ของ Nx อาจคุ้มกับ overhead
