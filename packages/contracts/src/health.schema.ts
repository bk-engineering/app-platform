import { z } from "zod";

export const HealthCheckSchema = z.object({
  status: z.enum(["ok"]),
  checkedAt: z.iso.datetime(),
});
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const ReadinessCheckSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  checkedAt: z.iso.datetime(),
  checks: z.object({
    postgres: z.object({ ok: z.boolean(), latencyMs: z.number().optional() }),
    redis: z.object({ ok: z.boolean(), latencyMs: z.number().optional() }).optional(),
  }),
});
export type ReadinessCheck = z.infer<typeof ReadinessCheckSchema>;
