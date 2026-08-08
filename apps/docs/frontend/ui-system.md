---
title: ระบบ UI (shadcn/ui)
status: planned
statusNote: มีแค่ Button ที่เขียนเองโดยไม่ผ่าน shadcn CLI ไม่มี components.json และไม่มี Radix primitive เลย
---

# ระบบ UI (shadcn/ui)

<Status value="planned" note="Button ที่มีอยู่ไม่ได้มาจาก CLI จริง" />

shadcn/ui ไม่ใช่ npm package ที่ import เข้ามาใช้ — มันคือ CLI ที่ copy โค้ด component ลงมาไว้ใน repo โดยตรง เราแก้มันได้เต็มที่เพราะเราเป็นเจ้าของโค้ดนั้นจริง ๆ

## ทำไมเลือก copy-paste model แทน npm package

| | npm component library (เช่น MUI, Antd) | shadcn/ui |
| --- | --- | --- |
| โค้ดอยู่ที่ไหน | `node_modules`, แก้ไม่ได้ตรง ๆ | อยู่ใน `components/ui/` ของ repo เราเอง |
| Bundle size | โหลดทั้ง library แม้ใช้ไม่กี่ตัว | มีเฉพาะ component ที่ `npx shadcn add` มาจริง |
| ปรับ style | ต้อง override ผ่าน theme API ของ library | แก้ Tailwind class ตรง ๆ ในไฟล์ |
| อัปเดตเวอร์ชัน | `npm update` แล้วอาจพัง breaking change | ไม่มี "เวอร์ชัน" — โค้ดหยุดนิ่งจนกว่าจะแก้เอง |
| Accessibility | ได้มาฟรีถ้า library ทำดี | ได้มาฟรีเพราะ base เป็น Radix primitive |

ข้อเสียคือ **ต้องดูแล security patch เอง** — ไม่มี `npm audit` มาเตือนโค้ดที่ copy มาแล้ว นี่คือ trade-off ที่ยอมรับเพื่อแลกกับความยืดหยุ่น

## ตั้งค่าเริ่มต้น

```bash
npx shadcn@latest init
```

คำสั่งนี้สร้าง `components.json` ซึ่งเป็นค่ากลางที่ CLI ใช้อ้างอิงทุกครั้งที่เพิ่ม component ใหม่

```json
{
  "style": "default",
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

`cssVariables: true` ผูกตรงกับ [ธีม & dark mode](/frontend/theming#css-variable-ต่อโหมด) — สี component ทุกตัวอ้างผ่าน CSS variable ไม่ใช่ hex ตรง ๆ ทำให้สลับ dark mode ได้โดยไม่ต้องแก้ component แม้แต่ไฟล์เดียว

## เพิ่ม component ใหม่

```bash
npx shadcn@latest add button dialog form
```

คำสั่งนี้เขียนไฟล์ลงตรง ๆ ที่ `components/ui/button.tsx` เป็นต้น — ไม่ใช่ dependency ใน `package.json` ตรวจสอบด้วยตาว่าไฟล์เข้ามาถูกที่แล้ว `git add` ตามปกติ

## โครงสร้างโฟลเดอร์

```text
apps/web/src/components/
├── ui/              # component จาก shadcn CLI — แก้ได้ แต่ไม่ควรใส่ business logic
│   ├── button.tsx
│   ├── dialog.tsx
│   └── field.tsx
└── forms/           # component ที่ประกอบ ui/ + react-hook-form เข้าด้วยกัน เฉพาะโปรเจกต์นี้
    └── login-form.tsx
```

::: tip อย่าใส่ data fetching เข้าไปใน `components/ui/`
`components/ui/*` ควรเป็น presentational ล้วน — รับ prop, render, เรียก callback สิ่งที่รู้เรื่อง query, mutation หรือ route ควรอยู่ใน `components/forms/` หรือใกล้ page ที่ใช้จริง แยกกันไว้ทำให้ upgrade component จาก CLI ในอนาคตไม่ชนกับ logic ของเรา
:::

## Component ตัวอย่างที่ผ่าน CLI จริง

```tsx
// apps/web/src/components/ui/button.tsx — เป้าหมาย (สร้างจาก `shadcn add button`)
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
```

สองจุดที่ทำให้เวอร์ชันนี้ต่างจากของจริงในโปรเจกต์วันนี้: ใช้สี `primary`/`accent` ที่ผูกกับ CSS variable (ไม่ใช่ `bg-brand-600` ที่ไม่มีนิยามอยู่จริง) และมี `asChild` ผ่าน Radix `Slot` ทำให้ `<Button asChild><Link href="/x">ไป</Link></Button>` render เป็น `<a>` ตัวเดียวแทนที่จะซ้อน `<button><a>` ผิด HTML

::: danger `bg-brand-600` ใน `button.tsx` ปัจจุบันคือ token ที่ไม่มีอยู่จริง
โค้ดวันนี้อ้าง `bg-brand-600`, `bg-brand-700`, `border-brand-500` ฯลฯ แต่ Tailwind config ไม่มีการนิยาม `brand` scale เลย — class เหล่านี้ไม่ output CSS อะไรออกมา ปุ่มจึงไม่มีสีพื้นหลังเลยตอนนี้ ต้องแก้พร้อมกับตั้ง `components.json` และ CSS variable ให้ครบ ไม่ใช่แก้แค่ชื่อ class
:::

## เชื่อมกับสิทธิ์การใช้งาน

component ใน `ui/` ไม่ควรรู้เรื่อง CASL เลย — การซ่อน/แสดงตาม ability ทำที่ระดับสูงกว่า โดยห่อ component ด้วย `<Can>` จาก [สิทธิ์บน UI](/frontend/permissions-client) แทนที่จะเขียนเงื่อนไขสิทธิ์ไว้ใน component เอง

```tsx
<Can I="create" a="User">
  <Button onClick={openCreateDialog}>เพิ่มผู้ใช้</Button>
</Can>
```

การแยกชั้นแบบนี้ทำให้ `Button` re-use ได้ทุกที่โดยไม่ผูกกับโดเมนธุรกิจใด ๆ

## Accessibility ที่ได้มาฟรี

| Primitive ของ Radix | สิ่งที่จัดการให้อัตโนมัติ |
| --- | --- |
| `Dialog` | focus trap, คืน focus ให้ trigger ตอนปิด, `Esc` ปิด, `aria-modal` |
| `DropdownMenu` | คีย์ลูกศรเลื่อนเมนู, `role="menu"` ที่ถูกต้อง |
| `Select` | เชื่อม label กับ control ผ่าน `aria-labelledby` อัตโนมัติ |
| `Slot` (`asChild`) | ไม่เพิ่ม element พิเศษที่ทำลายความหมายของ HTML (เช่น `<button>` ซ้อนใน `<a>`) |

การเขียน component เองใหม่หมด (อย่างที่ `button.tsx` ปัจจุบันทำ) แปลว่าเสีย behavior เหล่านี้ไปฟรี ๆ โดยไม่จำเป็น

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| `components.json` จาก `shadcn init` | ไม่มีไฟล์นี้ในโปรเจกต์ |
| `Button` สร้างจาก `shadcn add button` (Radix `Slot`, `asChild`) | `button.tsx` เขียนเอง ไม่มี `Slot`, ไม่มี `asChild`, ไม่ได้มาจาก CLI |
| สี component ผูกกับ CSS variable | อ้าง `bg-brand-600` ที่ไม่มีนิยามใน Tailwind config เลย |
| dependency `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` | **ติดตั้งครบแล้ว** ใน `package.json` |
| `@radix-ui/*` | ยังไม่ได้ติดตั้งเลยสักตัว |
| component อื่นนอกจาก Button (`Dialog`, `Input`, `Field`, ฯลฯ) | ไม่มี |
:::
