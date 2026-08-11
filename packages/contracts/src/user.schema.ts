import { z } from "zod";

export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const UserRoleSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  name: z.string(),
});

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1).max(120),
  status: UserStatusSchema,
  locale: z.string(),
  theme: ThemeSchema,
  roles: z.array(UserRoleSchema),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(120),
  password: z.string().min(8).max(72),
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  email: z.email().max(255).optional(),
  status: UserStatusSchema.optional(),
  roleIds: z.array(z.uuid()).optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const UpdateMeSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  locale: z.string().min(2).max(5).optional(),
  theme: ThemeSchema.optional(),
});
export type UpdateMe = z.infer<typeof UpdateMeSchema>;

export const PasswordSchema = z.string().min(8).max(72);

export const ChangePasswordSchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema,
});
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
