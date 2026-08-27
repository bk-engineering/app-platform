---
title: UI system (shadcn/ui)
status: implemented
statusNote: components.json exists, and Button/Dialog/Select/Checkbox/Table/etc. are real Radix-backed components with colors bound to CSS variables
---

# UI system (shadcn/ui)

<Status value="implemented" note="the components used across the product pages are real and Radix-backed" />

shadcn/ui isn't an npm package you import — it's a CLI that copies component code directly into the repo. We can fully edit it because we genuinely own that code.

## Why copy-paste instead of an npm package

| | npm component library (e.g. MUI, Antd) | shadcn/ui |
| --- | --- | --- |
| Where the code lives | `node_modules`, can't edit directly | `core/ui/` in our own repo |
| Bundle size | Ships the whole library even if you use a handful of pieces | Only the components `npx shadcn add` actually copied |
| Adjusting style | Override through the library's theme API | Edit the Tailwind classes directly in the file |
| Upgrading | `npm update`, may bring a breaking change | No "version" — the code stays put until you change it |
| Accessibility | Free if the library did it well | Free because it's built on Radix primitives |

The trade-off: **you own security patching yourself.** No `npm audit` warns you about code that's been copied in. That's an accepted cost in exchange for flexibility.

## Initial setup

```bash
npx shadcn@latest init
```

This generates `components.json`, the config the CLI reads every time it adds a new component.

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
    "utils": "@/shared/lib",
    "ui": "@/core/ui"
  }
}
```

`cssVariables: true` ties directly into [Theming & dark mode](/en/frontend/theming#css-variables-per-mode) — every component's color is a reference to a CSS variable, never a raw hex value, so dark mode can be switched without touching a single component file.

## Adding a new component

```bash
npx shadcn@latest add button dialog form
```

This writes files directly — e.g. `core/ui/button.tsx` — rather than adding a `package.json` dependency. Review the diff visually, then `git add` as usual.

## Folder structure

```text
apps/web/src/components/
├── ui/              # components from the shadcn CLI — editable, but shouldn't hold business logic
│   ├── button.tsx
│   ├── dialog.tsx
│   └── field.tsx
└── forms/           # components combining ui/ with react-hook-form — specific to this project
    └── login-form.tsx
```

::: tip Don't put data fetching inside `core/ui/`
`core/ui/*` should stay purely presentational — props in, render out, callbacks on interaction. Anything that knows about queries, mutations, or routes belongs in `features/*/` or near the page that uses it. Keeping that boundary means future upgrades of a CLI-generated component won't collide with our own logic.
:::

## A component the way the CLI would generate it

```tsx
// apps/web/src/core/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";

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

The real code uses `primary`/`accent` colors bound to CSS variables (not the old `bg-brand-600`, which had no definition), and it has `asChild` via Radix's `Slot`, so `<Button asChild><Link href="/x">Go</Link></Button>` renders a single `<a>` instead of nesting `<button><a>` — invalid HTML. The real `Button` also has more variants than this example (`destructive`, `secondary`, an `icon` size).

::: tip `bg-brand-600` is fixed
`button.tsx` used to reference `bg-brand-600`, which had no Tailwind config definition, so the button had no background color at all. It's now `primary`/`accent`/`destructive`, all bound to CSS variables in `globals.css` (see [Theming & dark mode](/en/frontend/theming)), so it switches with dark mode without touching the component.
:::

## Wiring into permissions

Components under `ui/` shouldn't know anything about CASL — hiding/showing based on ability happens one layer up, by wrapping a component in `<Can>` from [Permissions in the UI](/en/frontend/permissions-client) rather than baking permission logic into the component itself.

```tsx
<Can I="create" a="User">
  <Button onClick={openCreateDialog}>Add user</Button>
</Can>
```

This separation keeps `Button` reusable anywhere without tying it to any business domain.

## Accessibility you get for free

| Radix primitive | Handles automatically |
| --- | --- |
| `Dialog` | Focus trap, returns focus to the trigger on close, `Esc` closes it, `aria-modal` |
| `DropdownMenu` | Arrow-key navigation, correct `role="menu"` |
| `Select` | Wires label to control via `aria-labelledby` automatically |
| `Slot` (`asChild`) | Doesn't add extra elements that break HTML semantics (e.g. `<button>` nested in `<a>`) |

Rewriting a component fully from scratch without a Radix primitive underneath means losing this behavior for no reason — the current components avoid that by wrapping Radix primitives directly.

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `components.json` | Real, in the project |
| `Button` using Radix `Slot`, `asChild` | Real, with `default`/`outline`/`ghost`/`destructive`/`secondary` variants |
| Component colors bound to CSS variables | Real — `primary`/`accent`/`destructive`/`success`/`border`/etc. in `globals.css` |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` dependencies | Installed and used |
| `@radix-ui/*` | Installed and used: `react-slot`, `react-dialog`, `react-select`, `react-checkbox`, `react-label`, `react-tooltip`, `react-dropdown-menu` |
| Components besides Button | Real: `Dialog`, `Select`, `Checkbox`, `Label`, `Field`, `Table`, `Badge`, `Skeleton`, `EmptyState`, `Tooltip`, `DropdownMenu`, `Toaster` (sonner) |
:::
