---
title: Data fetching (TanStack Query)
status: in-progress
statusNote: query key convention plus a query/mutation hook for every resource (users, roles, dashboard, audit log, me) now exist — server prefetch + HydrationBoundary is still missing
---

# Data fetching (TanStack Query)

<Status value="in-progress" note="hooks are real now; server prefetch/hydration is the remaining gap" />

Any request that needs caching, revalidation, or dedupe goes through TanStack Query. No `useEffect` + raw `fetch` in pages.

## Why not `useEffect` + `fetch`

```tsx
// ❌ Don't do this — no cache, refetches on every mount, races when id changes fast
useEffect(() => {
  fetch(`/api/users/${id}`).then((r) => r.json()).then(setUser);
}, [id]);
```

The problem isn't the line count — it's the behavior that's missing. No dedupe between two components requesting the same data at once, no retry, no stale-while-revalidate, and no cancellation of a stale request when `id` changes before the first response lands. TanStack Query fixes all of this with one idea: **the query key is the cache key.**

## The `QueryClientProvider` today <Status value="implemented" inline />

```tsx
// apps/web/src/app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/core/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // api-client already retries once after a token refresh —
              // an ApiError past that point means the request is genuinely bad
              if (error instanceof ApiError) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

`retry` is centralized now: an `ApiError` (meaning the retried-after-refresh request still failed) doesn't retry further; other errors (network) retry up to 2 times. There's still no central `staleTime` — each hook sets its own based on how fresh that data needs to be.

::: tip `retry` needs to understand our own error shape
TanStack Query's default retry (3 attempts, exponential backoff) doesn't distinguish `4xx` from `5xx` — retrying a `404` or `422` three times just makes the user wait longer for the same result. Always gate on the actual condition.
:::

## Query key convention <Status value="implemented" inline />

```ts
// apps/web/src/core/auth/query-keys.ts (sessionKeys) + entities/*/query-keys.ts + features/*/query-keys.ts
export const userKeys = {
  all: ["users"] as const,
  list: (filters: { page: number; search?: string }) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};
```

The real project has `sessionKeys`, `userKeys`, `roleKeys`, and `dashboardKeys` in this one file, following this shape.

| Rule | Why |
| --- | --- |
| Keys are always arrays, never a single string | `invalidateQueries({ queryKey: userKeys.all })` clears list and detail together from one prefix |
| Filters/params go inside the key | Different filters are different cache entries — otherwise a search page shows the previous filter's results |
| Export one object, not scattered constants | "Who uses this key" is answerable from one place, which makes refactors safer |

## Writing a query hook <Status value="implemented" inline />

```ts
// apps/web/src/entities/user/use-users.ts
import { useQuery } from "@tanstack/react-query";
import { paginatedSchema, UserSchema } from "@app-platform/contracts";
import { request } from "@/core/api-client";
import { userKeys } from "@/core/auth";

export function useUsers(page: number, search: string) {
  return useQuery({
    queryKey: userKeys.list({ page, search: search || undefined }),
    queryFn: () =>
      request(`/v1/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`, paginatedSchema(UserSchema)),
    placeholderData: (prev) => prev, // avoids a flash of empty state while paginating
  });
}
```

`request` comes from `core/api-client/api-client.ts` (see [Client session](/en/frontend/auth-client#automatic-refresh)) — it parses the response through the same schema the API uses to generate Swagger, so the type of `data` can never drift from what the server actually sends. The real project has a hook like this per resource: `use-users.ts`, `use-roles.ts`, `use-dashboard.ts`, `use-me.ts`, `use-change-password.ts`.

## Server prefetch + Hydration

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant L as layout.tsx (Server Component)
  participant API as NestJS API
  participant C as Client Component

  B->>L: request first page
  L->>API: prefetchQuery → serverFetch (with cookies)
  API-->>L: JSON
  L->>L: dehydrate(queryClient)
  L-->>B: HTML with data + HydrationBoundary
  B->>C: hydrate — useQuery sees the prefetched cache, doesn't refetch
```

```tsx
// app/[locale]/(app)/users/page.tsx — Server Component, target
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

`useUsers` inside `<UsersTable />` (client component) must use **the exact same query key** as the prefetch. Otherwise hydration doesn't match up and the query refetches from the client immediately.

::: danger A mismatched key means the prefetch was wasted
`dehydrate`/`HydrationBoundary` match queries by serializing the whole `queryKey` object. If the server prefetches with `userKeys.list({ page: 1 })` but the client calls `useUsers({ page: 1, sort: undefined })`, the two keys may not match depending on property order. Always build keys both sides through one shared helper — never hand-assemble the array twice.
:::

## Mutations + invalidation <Status value="implemented" inline />

```ts
// apps/web/src/entities/user/use-users.ts
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateUser) =>
      apiFetch(`/users/${id}`, UserSchema, { method: "PATCH", body: JSON.stringify(dto) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.detail(id), updated);          // update immediately, no refetch needed
      queryClient.invalidateQueries({ queryKey: userKeys.all });        // but the list must refetch — filter/sort may have moved this row
    },
  });
}
```

::: tip `setQueryData` and `invalidateQueries` do different jobs
`setQueryData` patches the cache immediately with no network call — use it when you know the exact resulting value (like the detail of a record you just updated). `invalidateQueries` just marks data stale and waits for the next refetch — use it for queries whose outcome is uncertain (a list with filters/sort/pagination).
:::

## Handling errors

`apiFetch` always throws the same error object defined by the [error envelope](/en/conventions/errors), so components write one handler, once.

```tsx
const { data, error, isPending } = useUsers(filters);

if (error) {
  return <ErrorBanner code={error.code} message={t(`errors.${error.code}`)} />;
}
```

Bind `error.code` to a translated message in the locale files instead of showing the raw `error.message` — `message` in the error envelope is English, for debugging only. See the full [error code catalog](/en/reference/error-codes).

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `QueryClient` with central `staleTime`/`retry` defaults | `retry` is centralized (skips `ApiError` after a refresh) — no central `staleTime` yet, each hook sets its own |
| query/mutation hooks in `entities/*` and `features/*` | Exist for every resource: users, roles, dashboard, audit log, me, change-password |
| `request` client with single-flight refresh | Real, in `core/api-client/api-client.ts` — see [Client session](/en/frontend/auth-client) |
| Server prefetch + `HydrationBoundary` | Still missing — every route fetches from the client after mount |
| query key convention (`query-keys.ts`) | Real — `sessionKeys`, `userKeys`, `roleKeys`, `dashboardKeys` |
:::
