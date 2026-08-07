---
layout: home
hero:
  name: app-platform
  text: Single source of truth
  tagline: สเปกของ boilerplate ทั้งหมด — สถาปัตยกรรม สัญญาข้อมูล auth และคู่มือ โค้ดตามเอกสาร ไม่ใช่เอกสารตามโค้ด
  actions:
    - theme: brand
      text: boilerplate นี้คืออะไร
      link: /start/introduction
    - theme: alt
      text: เริ่มใช้งานใน 10 นาที
      link: /start/quickstart
    - theme: alt
      text: สถานะการ implement
      link: /start/roadmap
features:
  - title: สถาปัตยกรรม
    details: ภาพรวมระบบ container วงจรชีวิตของ request และ data model — พร้อม diagram
    link: /architecture/overview
  - title: Contract-first
    details: zod schema ใน packages/contracts เป็นแหล่งความจริงเดียวของ request/response ทั้งสองแอป
    link: /conventions/contract-first
  - title: Trace ID
    details: หนึ่ง id ตามรอยได้ตั้งแต่เบราว์เซอร์ ถึง API ถึง database ถึง log
    link: /platform/trace-id
  - title: Auth & สิทธิ์
    details: JWT + refresh rotation, Google OAuth, RBAC และ CASL ทั้งฝั่ง server และ UI
    link: /auth/overview
  - title: Error envelope
    details: รูปแบบ error เดียวทั้งระบบ พร้อม catalog ของ error code
    link: /conventions/errors
  - title: ADR
    details: ทำไมถึงเลือกแบบนี้ และทางเลือกไหนที่ถูกปฏิเสธ
    link: /adr/overview
---
