import { z } from "zod";

export const AuditLogSchema = z.object({
  id: z.uuid(),
  actorId: z.uuid().nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;
