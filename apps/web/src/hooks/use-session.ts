"use client";

import { useSyncExternalStore } from "react";
import { getSession, subscribeSession, type Session } from "@/lib/session";

export function useSession(): Session | null {
  return useSyncExternalStore(
    subscribeSession,
    getSession,
    () => null, // server snapshot: never authenticated during SSR, sessionStorage is client-only
  );
}
