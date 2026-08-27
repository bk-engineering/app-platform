---
title: Permissions in the UI
status: implemented
statusNote: AbilityProvider/<Can>/ForbiddenState are real and gate settings/users, settings/roles, and the nav — this page's code samples still need a pass to match the real @casl/react v7 API (see the Thai version for the accurate provider code)
---

# Permissions in the UI

<Status value="implemented" note="working in the app; some code samples below are stale — see /frontend/permissions-client (Thai) for the accurate provider" />

::: danger Read this first
Everything on this page is **user experience, not security.** `<Can>` hides buttons; it prevents nothing. Anyone can open devtools and call the API directly. Security lives in [server-side guards](/en/auth/casl), always and only.

The right framing: **the UI keeps users from seeing paths that would fail.** It does not stop them.
:::

## How rules get here

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant L as (app)/layout.tsx
  participant A as API
  participant P as AbilityProvider
  participant C as Component

  B->>L: navigate to /en/settings/users
  L->>A: GET /v1/auth/me (server-side, with cookies)
  A->>A: AbilityFactory.forUser()
  A-->>L: { user, rules: [...] }
  L->>L: dehydrate into HydrationBoundary
  L->>P: render with prefetched data
  P->>P: createMongoAbility(rules)
  P->>C: provide the ability via context
  C->>C: &lt;Can I="create" a="User"&gt;
  C-->>B: renders correctly with no flicker
```

Server-side prefetching means the first HTML is already correct — no moment where a button appears and then vanishes.

## The provider

```tsx
// apps/web/src/core/permissions/ability-context.tsx
"use client";
import { createContextualCan } from "@casl/react";
import { createMongoAbility } from "@casl/ability";
import { AbilityRulesSchema } from "@app-platform/contracts";

export const AbilityContext = createContext<AppAbility>(createMongoAbility([]));
export const Can = createContextualCan(AbilityContext.Consumer);

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({ queryKey: sessionKeys.me, queryFn: fetchMe, staleTime: 5 * 60_000 });

  const ability = useMemo(
    // no data means no permissions — never "all permissions"
    () => createMongoAbility(data ? AbilityRulesSchema.parse(data.rules) : []),
    [data],
  );

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export const useAbility = () => useContext(AbilityContext);
```

::: danger The default must deny everything
`createMongoAbility([])` denies everything. Default to "allow" and users see buttons they shouldn't during the loading window, click them, and get a `403` that reads like a bug.
:::

## Hiding things

```tsx
import { Can } from "@/core/permissions";

<Can I="create" a="User">
  <Button onClick={openCreateDialog}>{t("addUser")}</Button>
</Can>
```

Checking against a real record when rules carry `conditions`:

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

::: danger Always wrap with `subject()`
`ability.can("update", user)` with a plain object is **always wrong** — CASL has no way to know what type it is. Use `subject("User", user)`. Otherwise `conditions` are never evaluated and you get a wrong answer, usually wrong in the permissive direction.
:::

### Field-level restrictions

```tsx
const ability = useAbility();
const target = subject("User", user);

<FormField name="displayName" disabled={!ability.can("update", target, "displayName")} />
<FormField name="roles"       disabled={!ability.can("update", target, "roles")} />
```

A manager can edit another user but not their `roles`, so that field renders greyed out with an explanation instead of failing with a confusing `403` on save.

## Hide vs disable

| Situation | Do | Because |
| --- | --- | --- |
| No permission for the feature at all | **Hide** | They don't need to know it exists |
| Has the permission, but not for this row | **Disable + tooltip** | Explain why |
| Blocked by a business rule (last administrator) | **Disable + reason** | It's explainable, not a permission issue |
| No access to the whole page | **Omit from nav + a 403 page** | Direct URL access still needs an explanation |

```tsx
// a disabled control with a reason reads far better than a missing one
<Tooltip content={t("cannotEditOwnRole")}>
  <span>
    <Button disabled={!ability.can("update", target, "roles")}>{t("changeRole")}</Button>
  </span>
</Tooltip>
```

## Filtering navigation

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

## Guarding a whole page

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

::: tip Always check `isPending` first
Skip it and the user sees a "no permission" screen flash before the rules finish loading — more alarming than a skeleton.
:::

`<ForbiddenState />` should explain what happened and what to do, not just say "403":

```tsx
<EmptyState
  icon={<ShieldOff />}
  title={t("forbidden.title")}              // "You don't have access to this page"
  description={t("forbidden.description")}  // "Contact an administrator if you think this is wrong"
  action={<Link href="/dashboard">{t("forbidden.backToDashboard")}</Link>}
/>
```

## Keeping rules fresh

Permissions can change while someone is using the app — an administrator might be editing their role right now.

| Event | Action |
| --- | --- |
| An admin saves a role change | `invalidateQueries(sessionKeys.me)` if it's their own role |
| A refresh succeeds | Invalidate `me` — roles may have changed meanwhile |
| The tab regains focus | TanStack Query refetches automatically once past `staleTime` |
| The API returns an unexpected `403` | Invalidate `me` and re-render — the local rules are stale |

```ts
// one place that catches 403s contradicting what the UI believed
onError(error) {
  if (error instanceof ApiError && error.code === "AUTHZ_FORBIDDEN") {
    // the UI thought this was allowed but the server disagreed — our rules are old
    queryClient.invalidateQueries({ queryKey: sessionKeys.me });
  }
}
```

::: tip An unexpected 403 means stale rules
If the UI showed the button, the local ability said it was allowed. Getting a `403` therefore means permissions changed after the rules were fetched. Invalidating immediately lets the UI correct itself without the user refreshing.
:::

## Testing

```tsx
function renderWithAbility(ui: ReactNode, rules: RawRule[]) {
  return render(
    <AbilityContext.Provider value={createMongoAbility(rules)}>{ui}</AbilityContext.Provider>,
  );
}

it("hides the delete button for members", () => {
  renderWithAbility(<UserRow user={otherUser} />, MEMBER_RULES);
  expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
});

it("shows the delete button for managers", () => {
  renderWithAbility(<UserRow user={otherUser} />, MANAGER_RULES);
  expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
});
```

Testing that something is *hidden* matters more than testing that it's shown — that's the side where regressions happen.

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `@casl/ability` + `@casl/react` | Both installed and used |
| `AbilityProvider` + `<Can>` | Real, at `apps/web/src/core/permissions/ability-context.tsx` — wraps `@casl/react` v7's own `AbilityProvider`/`useAbility`/`Can` rather than hand-rolling a context (this page's code sample above predates that and is stale) |
| `GET /v1/auth/me` returning rules | Real — see [CASL](/en/auth/casl) |
| Permission-filtered navigation | Real, at `apps/web/src/components/app-nav.tsx` — filters the users/roles links by real ability |
| `<ForbiddenState />` | Real, at `apps/web/src/features/shell/forbidden-state.tsx`, gating `settings/users` and `settings/roles` |
| Server prefetch + hydrate | Still missing — `AbilityProvider` fires a client-side `useQuery` only |
| Tests | No test tooling in `apps/web` yet — existing ability tests are API-side only (`ability.factory.spec.ts`) |
:::
