import { z } from "zod";

export const TokenRequestSchema = z
  .object({
    grant_type: z.enum(["password", "refresh_token"]),
    username: z.email().optional(),
    password: z.string().min(8).max(72).optional(),
    refresh_token: z.string().optional(),
  })
  .refine(
    (data) =>
      data.grant_type === "password"
        ? Boolean(data.username && data.password)
        : Boolean(data.refresh_token),
    { message: "username+password are required for grant_type=password, refresh_token for grant_type=refresh_token" },
  );
export type TokenRequest = z.infer<typeof TokenRequestSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  expires_in: z.number(),
  refresh_token: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
