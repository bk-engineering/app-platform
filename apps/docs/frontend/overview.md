---
title: ภาพรวมฟรอนต์เอนด์
status: in-progress
statusNote: next-intl ต่อสายครบแล้ว TanStack Query มี provider แต่ยังไม่มี query hook ส่วน form, UI system และ theming ยังเป็นสเปกล้วน
---

# ภาพรวมฟรอนต์เอนด์

<Status value="in-progress" note="i18n ใช้งานได้จริง ที่เหลือยังเป็น plumbing หรือสเปก" />

หมวดนี้อธิบายว่า `apps/web` ประกอบกันยังไง — ตั้งแต่ดึงข้อมูล ไปจนถึงฟอร์ม ระบบ UI ภาษา และธีม หน้านี้คือแผนที่ ส่วนรายละเอียดแต่ละเรื่องอยู่ในหน้าย่อย

## สแต็กที่เลือกใช้

| งาน | เครื่องมือ | สถานะ |
| --- | --- | --- |
| Routing & rendering | Next.js 16 App Router | <Status value="implemented" inline /> |
| Data fetching / cache | TanStack Query | <Status value="in-progress" inline /> |
| ฟอร์ม + validate | react-hook-form + `zodResolver` | <Status value="planned" inline /> |
| ระบบ component | shadcn/ui (บน Radix + Tailwind) | <Status value="planned" inline /> |
| ภาษา | next-intl | <Status value="implemented" inline note="มีบั๊ก defaultLocale" /> |
| ธีม / dark mode | next-themes (ยังไม่ติดตั้ง) | <Status value="planned" inline /> |
| สัญญาข้อมูล | zod schema จาก `packages/contracts` | <Status value="planned" inline note="ยังไม่มีใครใน web import" /> |

ทุกแถวเลือกเพราะเหตุผลเดียวกัน: ให้ TypeScript จับความผิดพลาดตอน build แทนที่จะไปพังตอน runtime ในมือผู้ใช้

## โครงสร้างระดับสูง

```mermaid
flowchart TB
  subgraph Routing["Next.js App Router"]
    L["[locale]/layout.tsx<br/>Server Component"]
    P["[locale]/(app)/dashboard/page.tsx"]
  end

  subgraph CrossCutting["ตัดขวางทุกหน้า"]
    I18N["next-intl<br/>proxy.ts + routing.ts"]
    Q["TanStack Query<br/>providers.tsx"]
    TH["next-themes<br/>(ยังไม่มี)"]
    AB["AbilityProvider<br/>(ยังไม่มี)"]
  end

  subgraph Leaf["สิ่งที่ผู้ใช้เห็นจริง"]
    UI["shadcn/ui component"]
    FORM["react-hook-form + zod"]
  end

  L --> P
  I18N -.-> L
  Q -.-> L
  TH -.-> L
  AB -.-> L
  P --> UI
  P --> FORM
  UI --> FORM

  classDef done fill:#f0fdf4,stroke:#16a34a
  classDef todo fill:#fef2f2,stroke:#dc2626
  class I18N,Q done
  class TH,AB,UI,FORM todo
```

เส้นประ = provider ที่ห่อทั้งต้นไม้จาก layout เส้นทึบ = การ render ปกติ สีเขียวคือมีโค้ดจริงรันอยู่ สีแดงคือยังเป็นสเปก

## แผนที่หน้าเอกสาร

| หน้า | เรื่อง | สถานะ |
| --- | --- | --- |
| [Data fetching](/frontend/data-fetching) | TanStack Query, query key, prefetch/hydrate | <Status value="in-progress" inline /> |
| [ฟอร์ม](/frontend/forms) | react-hook-form + `zodResolver` บน schema เดียวกับ API | <Status value="planned" inline /> |
| [ระบบ UI](/frontend/ui-system) | shadcn/ui, `components.json`, การตั้ง token | <Status value="planned" inline /> |
| [i18n](/frontend/i18n) | next-intl, routing, ไฟล์ข้อความ | <Status value="implemented" inline /> |
| [ธีม & dark mode](/frontend/theming) | next-themes, CSS variable, toggle | <Status value="planned" inline /> |
| [Session ฝั่ง client](/frontend/auth-client) | เก็บ token, refresh อัตโนมัติ, ป้องกัน route | <Status value="planned" inline /> |
| [สิทธิ์บน UI](/frontend/permissions-client) | `<Can>`, `AbilityProvider` | <Status value="planned" inline /> |

หน้าผลิตภัณฑ์จริง (ที่ประกอบทุกอย่างข้างบนเข้าด้วยกัน) อยู่ในหมวด [หน้าผลิตภัณฑ์](/features/dashboard) — เช่น [แดชบอร์ด](/features/dashboard), [ตั้งค่า · จัดการผู้ใช้](/features/settings-users) และ [ตั้งค่า · ธีม](/features/settings-theme)

## หลักการออกแบบร่วม

สามข้อนี้ซ้ำอยู่ในแทบทุกหน้าย่อย เพราะเป็นแกนของทั้งฝั่ง frontend

1. **Server Component ก่อนเสมอ** — ดึงข้อมูลที่ต้องล็อกอินให้ prefetch จาก server แล้วส่งต่อผ่าน `HydrationBoundary` ไม่ใช่ยิงใหม่จาก client หลัง mount ดูตัวอย่างเต็มใน [Data fetching](/frontend/data-fetching#server-prefetch-hydration)
2. **สัญญาเดียว ใช้ซ้ำทุกที่** — schema ใน `packages/contracts` เป็นทั้ง type, `zodResolver` และตัวตรวจ response จริง ไม่มี type ที่พิมพ์ซ้ำมือ ดู [Contract-first workflow](/conventions/contract-first)
3. **UI ซ่อนปุ่ม ไม่ได้ป้องกัน** — `<Can>` และการเช็คสิทธิ์บนหน้าเว็บทำเพื่อ UX เท่านั้น server ต้องปฏิเสธเองเสมอ ดู [CASL authorization](/auth/casl)

::: tip อ่านหน้าไหนก่อน
ถ้าจะ implement หน้าใหม่สักหน้า ลำดับที่สมเหตุสมผลคือ i18n (มีอยู่แล้ว) → data fetching → UI system → forms → theming ทำตามลำดับนี้แล้ว dependency จะไม่ย้อนกลับมากัดกัน
:::

## สิ่งที่ยังไม่มี

- ไม่มี route จริงนอกจาก `[locale]/page.tsx` — ไม่มี dashboard, settings, profile หรือหน้า auth ใด ๆ
- ไม่มี query/mutation hook แม้แต่ตัวเดียว มีแค่ `QueryClientProvider` เปล่า ๆ
- ไม่มี form component เลย แม้ dependency จะติดตั้งไว้แล้ว
- `Button` ตัวเดียวที่มีไม่ได้ผ่าน shadcn CLI และอ้าง Tailwind token ที่ไม่มีจริง (`bg-brand-600`)
- ไม่มี dark mode ไม่มี `next-themes`

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| หน้า dashboard / settings / profile | มีแค่ `app/[locale]/page.tsx` กับ `layout.tsx` |
| query/mutation hook ในทุกหน้า | `providers.tsx` มี `QueryClientProvider` แต่ไม่มี hook ใช้งานจริงเลย |
| ฟอร์มผ่าน react-hook-form + zod | dependency ติดตั้งแล้ว ไม่มี form component |
| shadcn/ui เต็มระบบ | มีแค่ `components/ui/button.tsx` ที่เขียนเอง ไม่มี `components.json` |
| `apps/web` ใช้ schema จาก `packages/contracts` | ยังไม่มีจุดไหน import เลย |
| dark mode | ไม่มีโค้ดใด ๆ ที่เกี่ยวข้อง |
:::
