import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});
export type Login = z.infer<typeof LoginSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
