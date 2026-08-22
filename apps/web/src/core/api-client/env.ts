import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

// must reference process.env.NEXT_PUBLIC_API_URL directly — Next replaces it by
// literal text match at build time, so a dynamic process.env[name] lookup would be undefined
export const env = PublicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://api.localhost",
});
