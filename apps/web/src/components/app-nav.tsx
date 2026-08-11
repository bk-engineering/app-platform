"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Users, Shield, Palette, User as UserIcon } from "lucide-react";
import { useAbility } from "@/lib/ability-context";
import { canUnconditionally } from "@/lib/ability-helpers";
import { cn } from "@/lib/utils";

export function AppNav() {
  const t = useTranslations("Nav");
  const ability = useAbility();
  const pathname = usePathname();

  const items = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    {
      key: "users",
      href: "/settings/users",
      icon: Users,
      show: canUnconditionally(ability, "read", "User"),
    },
    { key: "roles", href: "/settings/roles", icon: Shield, show: ability.can("read", "Role") },
    { key: "theme", href: "/settings/theme", icon: Palette, show: true },
    { key: "profile", href: "/profile", icon: UserIcon, show: true },
  ].filter((item) => item.show);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
