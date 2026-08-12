---
title: สิทธิ์บน UI
status: implemented
statusNote: AbilityProvider/<Can>/ForbiddenState ทำงานจริง ใช้กรองหน้า settings/users, settings/roles และเมนู nav
---

# สิทธิ์บน UI

<Status value="implemented" note="AbilityProvider/<Can>/ForbiddenState ทำงานจริง ใช้กรองหน้าและเมนู nav" />

::: danger อ่านก่อนอย่างอื่น
ทุกอย่างในหน้านี้คือ **ประสบการณ์ผู้ใช้ ไม่ใช่ความปลอดภัย** `<Can>` ซ่อนปุ่ม ไม่ได้ป้องกันอะไร ใครก็เปิด devtools แล้วยิง API ตรงได้ ความปลอดภัยอยู่ที่ [guard ฝั่ง server](/auth/casl) เสมอและเท่านั้น

วิธีคิดที่ถูกคือ: **UI ทำให้ผู้ใช้ไม่เห็นทางที่จะล้มเหลว** ไม่ใช่ทำให้เขาทำไม่ได้
:::

## กฎเดินทางมายังไง

```mermaid
sequenceDiagram
  autonumber
  participant B as เบราว์เซอร์
  participant L as (app)/layout.tsx
  participant A as API
  participant P as AbilityProvider
  participant C as Component

  B->>L: เข้า /th/settings/users
  L->>A: GET /v1/auth/me (server, ใช้ cookie)
  A->>A: AbilityFactory.forUser()
  A-->>L: { user, rules: [...] }
  L->>L: dehydrate เข้า HydrationBoundary
  L->>P: render พร้อมข้อมูลที่ prefetch แล้ว
  P->>P: createMongoAbility(rules)
  P->>C: ให้ ability ผ่าน context
  C->>C: &lt;Can I="create" a="User"&gt;
  C-->>B: render โดยไม่มีจังหวะกะพริบ
```

prefetch ฝั่ง server ทำให้ HTML ชุดแรกถูกต้องตั้งแต่แรก ไม่มีจังหวะที่ปุ่มโผล่มาแล้วหายไป

## Provider

`@casl/react` v7 มี `AbilityProvider`/`useAbility`/`Can` ให้ใช้ตรง ๆ (เวอร์ชันก่อนหน้าต้องประกอบเองด้วย `createContextualCan` ตามที่เอกสารรุ่นก่อนแนะนำ) โค้ดจริงจึงห่อ provider ของ library อีกชั้นแทนที่จะสร้าง context เอง

```tsx
// apps/web/src/lib/ability-context.tsx
"use client";
import { AbilityProvider as CaslAbilityProvider, Can, useAbility as useCaslAbility } from "@casl/react";
import { buildAbility, type AppAbility } from "./ability";

export { Can };
const EMPTY_ABILITY = buildAbility([]); // ไม่มีข้อมูล = ไม่มีสิทธิ์ ไม่ใช่มีทุกสิทธิ์
export const useAbility = () => useCaslAbility<AppAbility>();

export function AbilityProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: session !== null,
    staleTime: 5 * 60_000,
  });

  const ability = useMemo(() => (me.data ? buildAbility(me.data.rules) : EMPTY_ABILITY), [me.data]);

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}
```

::: tip ยังเป็น client fetch ไม่ใช่ server prefetch
sequence diagram ด้านบนสมมุติว่า `(app)/layout.tsx` เป็น Server Component ที่ prefetch `GET /auth/me` แล้ว dehydrate เข้า `HydrationBoundary` — โค้ดจริงยังไม่มีสิ่งนั้น `AbilityProvider` ยิง `useQuery` ฝั่ง client เท่านั้น จึงมีจังหวะที่ ability เป็นค่าว่าง (ปฏิเสธทุกอย่าง) สั้น ๆ ระหว่างโหลดหน้าแรก — หน้าที่ gate ด้วย ability ต้องเช็ค `isPending` ก่อนเสมอ ดู [ป้องกันทั้งหน้า](#ป้องกันทั้งหน้า)
:::

::: danger ค่าเริ่มต้นต้องเป็น "ไม่มีสิทธิ์"
`createMongoAbility([])` ปฏิเสธทุกอย่าง ถ้าตั้งค่าเริ่มต้นเป็น "อนุญาต" ระหว่างที่ยังโหลด rules ไม่เสร็จ ผู้ใช้จะเห็นปุ่มที่ไม่ควรเห็นแวบหนึ่ง แล้วกดแล้วเจอ `403` ซึ่งอ่านเหมือนบั๊ก
:::

## ซ่อนของ

```tsx
import { Can } from "@/lib/ability-context";

<Can I="create" a="User">
  <Button onClick={openCreateDialog}>{t("addUser")}</Button>
</Can>
```

ตรวจกับแถวจริง เมื่อกฎมี `conditions`

```tsx
import { subject } from "@casl/ability";

{users.map((user) => (
  <TableRow key={user.id}>
    <TableCell>{user.displayName}</TableCell>
    <TableCell>
      <Can I="update" this={subject("User", user)}>
        <Button size="icon" variant="ghost"><Pencil /></Button>
      </Can>
      <Can I="delete" this={subject("User", user)}>
        <Button size="icon" variant="ghost"><Trash /></Button>
      </Can>
    </TableCell>
  </TableRow>
))}
```

::: danger ต้องห่อด้วย `subject()`
`ability.can("update", user)` ที่ส่ง object ดิบจะ **ผิดเสมอ** เพราะ CASL ไม่รู้ว่า object นั้นเป็นชนิดอะไร ต้อง `subject("User", user)` ให้ชัด ไม่งั้น `conditions` จะไม่ถูกประเมินและได้คำตอบผิด — โดยมักจะผิดในทางที่หลวมเกินไป
:::

### จำกัดระดับ field

```tsx
const ability = useAbility();
const target = subject("User", user);

<FormField name="displayName" disabled={!ability.can("update", target, "displayName")} />
<FormField name="roles"       disabled={!ability.can("update", target, "roles")} />
```

`manager` แก้ผู้ใช้คนอื่นได้แต่แก้ `roles` ไม่ได้ ช่อง role จึงเป็นสีเทาพร้อมคำอธิบาย แทนที่จะกด "บันทึก" แล้วเจอ `403` ที่งง ๆ

## ซ่อน vs แสดงแบบ disabled

| สถานการณ์ | ทำยังไง | เพราะ |
| --- | --- | --- |
| ไม่มีสิทธิ์กับทั้งฟีเจอร์ | **ซ่อน** | ไม่ต้องรู้ว่ามีอยู่ |
| มีสิทธิ์แต่แถวนี้ทำไม่ได้ | **disabled + tooltip** | บอกว่าทำไม |
| ทำไม่ได้เพราะกฎธุรกิจ (ผู้ดูแลคนสุดท้าย) | **disabled + เหตุผล** | อธิบายได้ ไม่ใช่เรื่องสิทธิ์ |
| ทั้งหน้าเข้าไม่ได้ | **ไม่แสดงในเมนู + หน้า 403** | เข้าตรงผ่าน URL แล้วต้องเจอคำอธิบาย |

```tsx
// disabled พร้อมเหตุผล อ่านง่ายกว่าปุ่มที่หายไปเฉย ๆ
<Tooltip content={t("cannotEditOwnRole")}>
  <span>
    <Button disabled={!ability.can("update", target, "roles")}>{t("changeRole")}</Button>
  </span>
</Tooltip>
```

## กรองเมนู

```tsx
const NAV = [
  { key: "dashboard", href: "/dashboard", icon: Home },
  { key: "users",     href: "/settings/users", icon: Users, can: ["read", "User"] },
  { key: "roles",     href: "/settings/roles", icon: Shield, can: ["read", "Role"] },
  { key: "audit",     href: "/settings/audit", icon: ScrollText, can: ["read", "AuditLog"] },
] as const;

const ability = useAbility();
const visible = NAV.filter((item) => !item.can || ability.can(...item.can));
```

## ป้องกันทั้งหน้า

```tsx
// app/[locale]/(app)/settings/users/page.tsx
export default function UsersPage() {
  const ability = useAbility();
  const { isPending } = useSession();

  if (isPending) return <PageSkeleton />;
  if (ability.cannot("read", "User")) return <ForbiddenState />;

  return <UsersTable />;
}
```

::: tip ตรวจ `isPending` ก่อนเสมอ
ถ้าไม่ตรวจ ผู้ใช้จะเห็นหน้า "ไม่มีสิทธิ์" แวบหนึ่งก่อนที่ rules จะโหลดเสร็จ ซึ่งน่าตกใจกว่าการเห็น skeleton
:::

`<ForbiddenState />` ควรอธิบายว่าเกิดอะไรขึ้นและทำอะไรต่อได้ ไม่ใช่แค่ "403"

```tsx
<EmptyState
  icon={<ShieldOff />}
  title={t("forbidden.title")}          // "คุณไม่มีสิทธิ์เข้าหน้านี้"
  description={t("forbidden.description")}  // "ติดต่อผู้ดูแลระบบหากคิดว่าไม่ถูกต้อง"
  action={<Link href="/dashboard">{t("forbidden.backToDashboard")}</Link>}
/>
```

## ทำให้กฎสดอยู่เสมอ

สิทธิ์เปลี่ยนได้ระหว่างที่ผู้ใช้กำลังใช้งาน — ผู้ดูแลอาจเปลี่ยน role ของเขาอยู่

| เหตุการณ์ | ทำอะไร |
| --- | --- |
| ผู้ดูแลบันทึกการเปลี่ยน role | `invalidateQueries(sessionKeys.me)` ถ้าเป็น role ของตัวเอง |
| refresh token สำเร็จ | invalidate `me` เพราะ role อาจเปลี่ยนไประหว่างนั้น |
| กลับมาโฟกัสที่แท็บ | TanStack Query refetch ให้เองถ้าเลย `staleTime` |
| API ตอบ `403` ที่ไม่คาดคิด | invalidate `me` แล้ว render ใหม่ — กฎในมือน่าจะเก่า |

```ts
// จุดเดียวที่จับ 403 ที่ขัดกับสิ่งที่ UI คิด
onError(error) {
  if (error instanceof ApiError && error.code === "AUTHZ_FORBIDDEN") {
    // UI คิดว่าทำได้แต่ server ไม่ให้ = กฎที่ถืออยู่เก่าแล้ว
    queryClient.invalidateQueries({ queryKey: sessionKeys.me });
  }
}
```

::: tip `403` ที่ไม่คาดคิดคือสัญญาณว่ากฎเก่า
ถ้า UI แสดงปุ่มไว้แปลว่า ability ที่ถืออยู่บอกว่าทำได้ การได้ `403` จึงแปลว่าสิทธิ์เปลี่ยนหลังจากที่โหลด rules มา การ invalidate ทันทีทำให้ UI ปรับตัวเองโดยผู้ใช้ไม่ต้อง refresh
:::

## เทส

```tsx
function renderWithAbility(ui: ReactNode, rules: RawRule[]) {
  return render(
    <AbilityContext.Provider value={createMongoAbility(rules)}>{ui}</AbilityContext.Provider>,
  );
}

it("ซ่อนปุ่มลบสำหรับ member", () => {
  renderWithAbility(<UserRow user={otherUser} />, MEMBER_RULES);
  expect(screen.queryByRole("button", { name: /ลบ/ })).not.toBeInTheDocument();
});

it("แสดงปุ่มลบสำหรับ manager", () => {
  renderWithAbility(<UserRow user={otherUser} />, MANAGER_RULES);
  expect(screen.getByRole("button", { name: /ลบ/ })).toBeInTheDocument();
});
```

เทสว่า "ไม่แสดง" สำคัญกว่าเทสว่า "แสดง" — เพราะเป็นฝั่งที่ regression มักจะเกิด

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| `@casl/ability` + `@casl/react` | ✅ ทั้งคู่ติดตั้งแล้ว |
| `AbilityProvider` + `<Can>` | ✅ `apps/web/src/lib/ability-context.tsx` ห่อ `@casl/react` v7 (ไม่ได้ประกอบ context เอง) ต่อเข้ากับ `providers.tsx` |
| `GET /auth/me` ส่ง rules | ✅ ดู [CASL](/auth/casl) (route จริงไม่มี `/v1` prefix) |
| เมนูกรองตามสิทธิ์ | ✅ `apps/web/src/components/app-nav.tsx` กรองรายการ users/roles ด้วย ability จริง |
| `<ForbiddenState />` | ✅ `apps/web/src/components/forbidden-state.tsx` ใช้กรองหน้า `settings/users`, `settings/roles` ด้วย ability check |
| server prefetch + hydrate | ไม่มี — `AbilityProvider` ยิง `useQuery` ฝั่ง client เท่านั้น |
| เทส | ไม่มีเครื่องมือเทสใน `apps/web` เลย — เทส `<Can>`/ability ที่มีอยู่ตอนนี้เป็นฝั่ง API (`ability.factory.spec.ts`) เท่านั้น |
:::
