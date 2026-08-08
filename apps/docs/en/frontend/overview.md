---
title: Frontend overview
status: in-progress
statusNote: next-intl is fully wired, TanStack Query has a provider but zero hooks, forms/UI system/theming are still spec-only
---

# Frontend overview

<Status value="in-progress" note="i18n actually works; the rest is plumbing or spec" />

This section explains how `apps/web` fits together — data fetching, forms, the UI system, language, and theming. This page is the map; details for each topic live in the sub-pages.

## The chosen stack

| Concern | Tool | Status |
| --- | --- | --- |
| Routing & rendering | Next.js 16 App Router | <Status value="implemented" inline /> |
| Data fetching / cache | TanStack Query | <Status value="in-progress" inline /> |
| Forms + validation | react-hook-form + `zodResolver` | <Status value="planned" inline /> |
| Component system | shadcn/ui (on Radix + Tailwind) | <Status value="planned" inline /> |
| Language | next-intl | <Status value="implemented" inline note="defaultLocale bug" /> |
| Theme / dark mode | next-themes (not installed yet) | <Status value="planned" inline /> |
| Data contracts | zod schemas from `packages/contracts` | <Status value="planned" inline note="nothing in web imports them yet" /> |

Every row was chosen for the same reason: let TypeScript catch mistakes at build time instead of in a user's browser at runtime.

## High-level shape

```mermaid
flowchart TB
  subgraph Routing["Next.js App Router"]
    L["[locale]/layout.tsx<br/>Server Component"]
    P["[locale]/(app)/dashboard/page.tsx"]
  end

  subgraph CrossCutting["Cuts across every page"]
    I18N["next-intl<br/>proxy.ts + routing.ts"]
    Q["TanStack Query<br/>providers.tsx"]
    TH["next-themes<br/>(doesn't exist yet)"]
    AB["AbilityProvider<br/>(doesn't exist yet)"]
  end

  subgraph Leaf["What the user actually sees"]
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

Dashed lines = providers wrapping the whole tree from the layout. Solid lines = normal rendering. Green means real code runs today; red means it's still spec.

## Page map

| Page | Topic | Status |
| --- | --- | --- |
| [Data fetching](/en/frontend/data-fetching) | TanStack Query, query keys, prefetch/hydrate | <Status value="in-progress" inline /> |
| [Forms](/en/frontend/forms) | react-hook-form + `zodResolver` on the same schema as the API | <Status value="planned" inline /> |
| [UI system](/en/frontend/ui-system) | shadcn/ui, `components.json`, token setup | <Status value="planned" inline /> |
| [i18n](/en/frontend/i18n) | next-intl, routing, message files | <Status value="implemented" inline /> |
| [Theming & dark mode](/en/frontend/theming) | next-themes, CSS variables, toggle | <Status value="planned" inline /> |
| [Client session](/en/frontend/auth-client) | token storage, automatic refresh, route protection | <Status value="planned" inline /> |
| [Permissions in the UI](/en/frontend/permissions-client) | `<Can>`, `AbilityProvider` | <Status value="planned" inline /> |

The actual product pages (which assemble everything above) live under [Product features](/en/features/dashboard) — e.g. [Dashboard](/en/features/dashboard), [Settings · User management](/en/features/settings-users), and [Settings · Theme](/en/features/settings-theme).

## Shared design principles

These three repeat across almost every sub-page, because they're the backbone of the whole frontend.

1. **Server Components first.** Data that requires a session gets prefetched on the server and handed off through `HydrationBoundary` — never re-fetched from the client after mount. Full example in [Data fetching](/en/frontend/data-fetching#server-prefetch-hydration).
2. **One contract, reused everywhere.** Schemas in `packages/contracts` are simultaneously a type, a `zodResolver`, and the thing that validates the real response. No hand-typed duplicate. See [Contract-first workflow](/en/conventions/contract-first).
3. **UI hides buttons; it doesn't enforce anything.** `<Can>` and any client-side permission check exist for UX only — the server always rejects on its own. See [CASL authorization](/en/auth/casl).

::: tip Where to start implementing
If you're about to build a new page, a sane order is i18n (already there) → data fetching → UI system → forms → theming. Following this order means the dependencies won't loop back and bite you.
:::

## What's missing today

- No real route besides `[locale]/page.tsx` — no dashboard, settings, profile, or any auth pages.
- Zero query/mutation hooks. Just an empty `QueryClientProvider`.
- No form component anywhere, despite the dependencies being installed.
- The one `Button` that exists wasn't generated via the shadcn CLI and references a Tailwind token that doesn't exist (`bg-brand-600`).
- No dark mode. No `next-themes`.

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| dashboard / settings / profile pages | Only `app/[locale]/page.tsx` and `layout.tsx` exist |
| query/mutation hooks powering every page | `providers.tsx` has a `QueryClientProvider` but not a single hook uses it |
| forms via react-hook-form + zod | Dependencies installed; no form component exists |
| shadcn/ui as a full system | Only `components/ui/button.tsx`, hand-written; no `components.json` |
| `apps/web` consuming `packages/contracts` | No import anywhere yet |
| dark mode | No related code at all |
:::
