import { z } from "zod";
import { AbilityRulesSchema, TokenResponseSchema } from "@app-platform/contracts";
import { request } from "./api-client";
import { clearSession, setSession } from "./session";

export const MeResponseSchema = z.object({
  user: z.object({ id: z.string(), email: z.string() }),
  rules: AbilityRulesSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export async function login(email: string, password: string): Promise<void> {
  const tokens = await request("/auth/token", TokenResponseSchema, {
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
  return request("/auth/me", MeResponseSchema);
}
