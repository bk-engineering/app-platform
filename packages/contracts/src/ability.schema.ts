import { z } from "zod";

export const ACTIONS = ["manage", "create", "read", "update", "delete"] as const;
export const SUBJECTS = ["all", "User", "Role", "Permission", "AuditLog", "File"] as const;

export type AppAction = (typeof ACTIONS)[number];
export type AppSubject = (typeof SUBJECTS)[number];

/** open only the operators we need — not the whole MongoQuery grammar */
const ConditionValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z
    .object({
      $eq: z.unknown().optional(),
      $ne: z.unknown().optional(),
      $in: z.array(z.unknown()).optional(),
      $nin: z.array(z.unknown()).optional(),
    })
    .strict(),
]);

export const RawRuleSchema = z.object({
  action: z.enum(ACTIONS),
  subject: z.enum(SUBJECTS),
  fields: z.array(z.string()).optional(),
  conditions: z.record(z.string(), ConditionValueSchema).optional(),
  inverted: z.boolean().optional(),
  reason: z.string().optional(),
});
export type RawRule = z.infer<typeof RawRuleSchema>;

export const AbilityRulesSchema = z.array(RawRuleSchema);
