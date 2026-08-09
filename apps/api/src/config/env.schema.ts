import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.url().startsWith("postgresql://"),
  REDIS_URL: z.url().startsWith("redis://").optional(),

  // 32 characters or more, and never the placeholder value — guards against `.env.example` leaking to prod
  JWT_ACCESS_SECRET: z.string().min(32).refine((s) => !s.startsWith("change-me"), {
    message: "JWT_ACCESS_SECRET is still the placeholder value — generate one with: openssl rand -base64 48",
  }),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default("15m"),

  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean))
    .pipe(z.array(z.url()).min(1)),

  APP_WEB_URL: z.url().default("http://app.localhost"),
});

export type Env = z.infer<typeof EnvSchema>;
