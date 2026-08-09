"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/hooks/use-session";

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (session === null) return null;

  return children;
}
