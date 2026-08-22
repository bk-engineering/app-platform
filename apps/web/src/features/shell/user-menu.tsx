"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronsUpDown, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "@/core/i18n";
import { Link } from "@/core/i18n";
import { getMe } from "@/core/auth";
import { logout } from "@/core/auth";
import { useQueryClient } from "@tanstack/react-query";
import { sessionKeys } from "@/core/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/core/ui";

export function UserMenu() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: sessionKeys.me, queryFn: getMe });

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push("/login");
  };

  const name = me.data?.user.displayName ?? me.data?.user.email ?? "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton aria-label={t("account")} className="h-12">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <UserIcon className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{me.data?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel>{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">{t("profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
