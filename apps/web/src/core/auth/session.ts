import { z } from "zod";
import type { TokenResponse } from "@app-platform/contracts";

const STORAGE_KEY = "app-platform.session";

const StoredSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
}

let session: Session | null = null;
const listeners = new Set<(session: Session | null) => void>();

function persist(next: Session | null) {
  if (typeof window === "undefined") return;
  if (next) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

function load(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = StoredSessionSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

// hydrate from sessionStorage on first module load (client only)
if (typeof window !== "undefined") {
  session = load();
}

export function getSession(): Session | null {
  return session;
}

export function setSession(tokens: TokenResponse) {
  session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  persist(session);
  for (const listener of listeners) listener(session);
}

export function clearSession() {
  session = null;
  persist(null);
  for (const listener of listeners) listener(null);
}

export function subscribeSession(listener: (session: Session | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
