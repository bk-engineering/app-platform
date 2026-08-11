"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/hooks/use-session";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border p-4 sm:block">
        <p className="mb-6 px-3 text-lg font-semibold">app-platform</p>
        <AppNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="sm:hidden">
            <AppNav />
          </div>
          <div className="flex flex-1 justify-end gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
