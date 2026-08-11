import { createZodDto } from "nestjs-zod";
import { CreateRoleSchema, PermissionSchema, RoleSchema, UpdateRoleSchema } from "@app-platform/contracts";

export class RoleDto extends createZodDto(RoleSchema) {}
export class PermissionDto extends createZodDto(PermissionSchema) {}
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
