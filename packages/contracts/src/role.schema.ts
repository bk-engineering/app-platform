import { z } from "zod";

export const PermissionSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  action: z.string(),
  subject: z.string(),
});
export type Permission = z.infer<typeof PermissionSchema>;

export const RoleSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  name: z.string(),
  isSystem: z.boolean(),
  permissionIds: z.array(z.uuid()),
  userCount: z.number().int().min(0),
});
export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "lowercase letters, numbers, and _ only"),
  name: z.string().trim().min(1).max(120),
  permissionIds: z.array(z.uuid()),
});
export type CreateRole = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  permissionIds: z.array(z.uuid()).optional(),
});
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
