"use client";

import { useEffect } from "react";
import { useRouter } from "@/core/i18n";
import { useSession } from "@/core/auth";
import { getSession } from "@/core/auth";

export default function HomePage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // useSyncExternalStore's server snapshot is always null (sessionStorage doesn't exist
    // during SSR) — the client's first render matches that on purpose to avoid a hydration
    // mismatch, then corrects itself a render later. Deferring past that correction with a
    // macrotask (and re-reading the live value) keeps a stale first-render null from routing
    // an actually logged-in user to /login.
    const id = setTimeout(() => {
      router.replace(getSession() === null ? "/login" : "/dashboard");
    }, 0);
    return () => clearTimeout(id);
  }, [session, router]);

  return null;
}
