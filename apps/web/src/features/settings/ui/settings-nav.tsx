"use client";

import { useTranslations } from "next-intl";
import { Users, Shield, Palette } from "lucide-react";
import { usePathname, Link } from "@/core/i18n";
import { useAbility, canUnconditionally } from "@/core/permissions";
import { cn } from "@/shared/lib";

export function SettingsNav() {
  const t = useTranslations("Nav");
  const ability = useAbility();
  const pathname = usePathname();

  const items = [
    { key: "users", href: "/settings/users", icon: Users, show: canUnconditionally(ability, "read", "User") },
    { key: "roles", href: "/settings/roles", icon: Shield, show: ability.can("read", "Role") },
    { key: "theme", href: "/settings/theme", icon: Palette, show: true },
  ].filter((item) => item.show);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
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
