"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Shield, Palette, User as UserIcon, Command } from "lucide-react";
import { usePathname, Link } from "@/i18n/navigation";
import { useAbility } from "@/lib/ability-context";
import { canUnconditionally } from "@/lib/ability-helpers";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

export function AppSidebar() {
  const t = useTranslations("Nav");
  const ability = useAbility();
  const pathname = usePathname();

  const groups = [
    {
      label: t("groupGeneral"),
      items: [{ key: "dashboard", href: "/dashboard", icon: LayoutDashboard, show: true }],
    },
    {
      label: t("groupSettings"),
      items: [
        {
          key: "users",
          href: "/settings/users",
          icon: Users,
          show: canUnconditionally(ability, "read", "User"),
        },
        { key: "roles", href: "/settings/roles", icon: Shield, show: ability.can("read", "Role") },
        { key: "theme", href: "/settings/theme", icon: Palette, show: true },
      ],
    },
    {
      label: t("groupAccount"),
      items: [{ key: "profile", href: "/profile", icon: UserIcon, show: true }],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <Link href="/dashboard">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
                  {t("appName")}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={active} tooltip={t(item.key)}>
                        <Link href={item.href}>
                          <Icon />
                          <span className="truncate group-data-[collapsible=icon]:hidden">{t(item.key)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
