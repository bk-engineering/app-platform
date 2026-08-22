import { z } from "zod";
import { AbilityRulesSchema, TokenResponseSchema, UserSchema } from "@app-platform/contracts";
import { request } from "@/core/api-client";
import { clearSession, setSession } from "./session";

export const MeResponseSchema = z.object({
  user: UserSchema,
  rules: AbilityRulesSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export async function login(email: string, password: string): Promise<void> {
  const tokens = await request("/v1/auth/token", TokenResponseSchema, {
    method: "POST",
    body: { grant_type: "password", username: email, password },
    skipAuth: true,
  });
  setSession(tokens);
}

export function logout(): void {
  clearSession();
}

export function getMe(): Promise<MeResponse> {
  return request("/v1/auth/me", MeResponseSchema);
}
