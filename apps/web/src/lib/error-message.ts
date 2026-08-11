import { ApiError } from "@/lib/api-client";

/** translation keys live under Errors.<code> in messages/*.json; falls back to Errors.GENERIC */
export function errorCode(err: unknown): string {
  return err instanceof ApiError ? err.code : "GENERIC";
}
