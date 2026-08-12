"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSession } from "@/hooks/use-session";
import { getSession } from "@/lib/session";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/settings/users": "users",
  "/settings/roles": "roles",
  "/settings/theme": "theme",
  "/profile": "profile",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");

  useEffect(() => {
    if (session !== null) return;
    // useSyncExternalStore's server snapshot is always null (sessionStorage doesn't exist
    // during SSR) — the client's first render matches that on purpose to avoid a hydration
    // mismatch, then corrects itself a render later. Deferring past that correction with a
    // macrotask (and re-reading the live value) keeps a stale first-render null from firing
    // a redirect for a user who is actually logged in.
    const id = setTimeout(() => {
      if (getSession() === null) router.replace("/login");
    }, 0);
    return () => clearTimeout(id);
  }, [session, router]);

  if (session === null) return null;

  const titleKey = PAGE_TITLE_KEYS[pathname];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{titleKey ? t(titleKey) : ""}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
