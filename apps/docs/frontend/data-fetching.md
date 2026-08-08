---
title: Data fetching (TanStack Query)
status: in-progress
statusNote: QueryClientProvider ใช้งานได้จริง แต่ไม่มี query หรือ mutation hook แม้แต่ตัวเดียวในโปรเจกต์
---

# Data fetching (TanStack Query)

<Status value="in-progress" note="provider พร้อม แต่ยังไม่มี hook ใช้งานจริง" />

ทุก request ที่ต้อง cache, revalidate หรือ dedupe ผ่าน TanStack Query ทั้งหมด ไม่ใช้ `useEffect` + `fetch` ตรง ๆ ในหน้าเว็บ

## ทำไมไม่ใช้ `useEffect` + `fetch`

```tsx
// ❌ อย่าทำแบบนี้ — ไม่มี cache, ยิงซ้ำทุกครั้งที่ mount, race condition ตอน id เปลี่ยนเร็ว
useEffect(() => {
  fetch(`/api/users/${id}`).then((r) => r.json()).then(setUser);
}, [id]);
```

ปัญหาไม่ใช่แค่โค้ดยาว แต่คือพฤติกรรมที่หายไป — ไม่มี dedupe ระหว่างสอง component ที่ขอข้อมูลเดียวกันพร้อมกัน ไม่มี retry, ไม่มี stale-while-revalidate, และไม่มีกลไกยกเลิก request เก่าเมื่อ `id` เปลี่ยนก่อน response แรกจะกลับมา TanStack Query แก้ทั้งหมดนี้ด้วยแนวคิดเดียว: **query key คือ cache key**

## `QueryClientProvider` ปัจจุบัน <Status value="implemented" inline />

```tsx
// apps/web/src/app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

ใช้งานได้จริงวันนี้ แต่ `new QueryClient()` ไม่ตั้ง default ใด ๆ — เป้าหมายคือตั้ง `staleTime`/`retry` กลางที่นี่ทีเดียว แทนที่จะเขียนซ้ำในทุก hook

```ts
// เป้าหมาย — ยังไม่ implement
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,     // ข้อมูลส่วนใหญ่ไม่ต้อง refetch ทุกครั้งที่ focus กลับมา
          retry: (failureCount, error) =>
            isApiError(error) && error.status >= 500 && failureCount < 2,
        },
      },
    }),
);
```

::: tip `retry` ต้องรู้จัก error shape ของเราเอง
retry ค่า default ของ TanStack Query (3 ครั้ง, exponential backoff) ไม่แยก `4xx` กับ `5xx` — retry `404` หรือ `422` สามรอบมีแต่ทำให้ผู้ใช้รอนานขึ้นโดยผลลัพธ์เหมือนเดิม ต้องเช็คเงื่อนไขเองเสมอ
:::

## Query key convention

```ts
// apps/web/src/hooks/query-keys.ts — เป้าหมาย
export const userKeys = {
  all: ["users"] as const,
  list: (filters: UsersFilter) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};
```

| กฎ | เหตุผล |
| --- | --- |
| key เป็น array เสมอ ไม่ใช่ string เดี่ยว | `invalidateQueries({ queryKey: userKeys.all })` ลบ list และ detail ทั้งหมดในทีเดียวจาก prefix เดียว |
| ใส่ filter/param ลงใน key | filter ต่างกัน = cache entry คนละอัน ไม่งั้นหน้าค้นหาจะเห็นผลลัพธ์ของ filter ก่อนหน้า |
| export เป็น object รวม ไม่กระจายทั่วโปรเจกต์ | หา "ใครใช้ key นี้บ้าง" ได้จากที่เดียว ตอน refactor ปลอดภัยกว่า |

## เขียน query hook

```ts
// apps/web/src/hooks/use-users.ts — เป้าหมาย
import { useQuery } from "@tanstack/react-query";
import { UsersListResponseSchema } from "@app-platform/contracts";
import { apiFetch } from "@/lib/api-client";
import { userKeys } from "./query-keys";

export function useUsers(filters: UsersFilter) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () =>
      apiFetch(`/users?${toSearchParams(filters)}`, UsersListResponseSchema),
    placeholderData: (prev) => prev, // กันหน้ากะพริบตอนเปลี่ยนหน้า pagination
  });
}
```

`apiFetch` มาจาก [Session ฝั่ง client](/frontend/auth-client#refresh-อัตโนมัติ) — มัน parse response ผ่าน schema เดียวกับที่ API ใช้สร้าง Swagger ดังนั้น type ของ `data` ไม่มีทาง drift จากสิ่งที่ server ส่งจริง

## Server prefetch + Hydration

```mermaid
sequenceDiagram
  autonumber
  participant B as เบราว์เซอร์
  participant L as layout.tsx (Server Component)
  participant API as NestJS API
  participant C as Client Component

  B->>L: request หน้าแรก
  L->>API: prefetchQuery → serverFetch (ใช้ cookie)
  API-->>L: JSON
  L->>L: dehydrate(queryClient)
  L-->>B: HTML พร้อมข้อมูล + HydrationBoundary
  B->>C: hydrate — useQuery เห็น cache ที่ prefetch ไว้แล้ว ไม่ยิงซ้ำ
```

```tsx
// app/[locale]/(app)/users/page.tsx — Server Component, เป้าหมาย
export default async function UsersPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: userKeys.list(DEFAULT_FILTERS),
    queryFn: () => serverFetch("/v1/users", UsersListResponseSchema),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
```

`useUsers` ใน `<UsersTable />` (client component) ต้องใช้ **query key เดียวกันเป๊ะ** กับที่ prefetch ไว้ ไม่งั้น hydration จะไม่จับคู่กันและ query ยิงซ้ำจาก client ทันที

::: danger key ไม่ตรงกัน = prefetch เสียเปล่า
`dehydrate`/`HydrationBoundary` จับคู่ query ด้วยการเทียบ `queryKey` แบบ serialize ทั้ง object ถ้า server prefetch ด้วย `userKeys.list({ page: 1 })` แต่ client เรียก `useUsers({ page: 1, sort: undefined })` สอง key อาจไม่ตรงกันตามลำดับ property ใช้ helper function ตัวเดียวสร้าง key ทั้งสองฝั่งเสมอ อย่าประกอบ array เองซ้ำที่
:::

## Mutation + invalidate

```ts
// apps/web/src/hooks/use-update-user.ts — เป้าหมาย
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateUser) =>
      apiFetch(`/users/${id}`, UserSchema, { method: "PATCH", body: JSON.stringify(dto) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.detail(id), updated);          // อัปเดตทันทีแบบไม่ต้อง refetch
      queryClient.invalidateQueries({ queryKey: userKeys.all });        // แต่ list ต้อง refetch เพราะ filter/sort อาจเปลี่ยนตำแหน่งแถวนี้
    },
  });
}
```

::: tip `setQueryData` กับ `invalidateQueries` ทำคนละหน้าที่
`setQueryData` แก้ cache ทันทีโดยไม่ยิง network — ใช้กับ query ที่รู้ผลลัพธ์แน่ชัดแล้ว (เช่น detail ของ record ที่เพิ่ง update) `invalidateQueries` แค่ทำเครื่องหมายว่า stale แล้วรอ refetch รอบถัดไป — ใช้กับ query ที่ผลลัพธ์ไม่แน่นอน (list ที่มี filter/sort/pagination)
:::

## จัดการ error

`apiFetch` โยน error object เดียวกับที่ [error envelope](/conventions/errors) นิยามไว้เสมอ ดังนั้น component เขียน handler ได้ครั้งเดียว

```tsx
const { data, error, isPending } = useUsers(filters);

if (error) {
  return <ErrorBanner code={error.code} message={t(`errors.${error.code}`)} />;
}
```

ผูก `error.code` กับข้อความแปลในไฟล์ locale แทนการโชว์ `error.message` ดิบ — `message` ของ error envelope เป็นภาษาอังกฤษไว้ debug เท่านั้น ดู [catalog รหัส error ทั้งหมด](/reference/error-codes)

::: warning สถานะโค้ดปัจจุบัน
| สเปกเป้าหมาย | โค้ดวันนี้ |
| --- | --- |
| `QueryClient` ตั้ง `staleTime`/`retry` กลาง | `providers.tsx` สร้าง `new QueryClient()` เปล่า ไม่มี default options |
| query/mutation hook ในโฟลเดอร์ `hooks/` | ไม่มีไฟล์ hook เกี่ยวกับ data fetching เลยในโปรเจกต์ |
| `apiFetch` client พร้อม single-flight refresh | ยังไม่มีไฟล์ `lib/api-client.ts` — ดู [Session ฝั่ง client](/frontend/auth-client) |
| Server prefetch + `HydrationBoundary` | ไม่มี route ที่ทำ data fetching เลยนอกจาก `page.tsx` ที่ไม่ดึงข้อมูลอะไร |
| query key convention (`query-keys.ts`) | ไม่มีไฟล์ |
:::
