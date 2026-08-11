import { Injectable } from "@nestjs/common";
import type { Prisma, Role } from "@prisma/client";
import type { CreateRole, UpdateRole } from "@app-platform/contracts";
import { RolesRepository } from "./roles.repository";
import { AbilityFactory } from "../auth/ability/ability.factory";
import { AuditLogService } from "../audit-log/audit-log.service";
import { Errors } from "../common/errors/app.exception";

type RoleWithCounts = Role & {
  permissions: { permissionId: string }[];
  users: { userId: string }[];
};

function toPublicRole(role: RoleWithCounts) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    isSystem: role.isSystem,
    permissionIds: role.permissions.map((p) => p.permissionId),
    userCount: role.users.length,
  };
}

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly abilityFactory: AbilityFactory,
    private readonly auditLog: AuditLogService,
  ) {}

  async list() {
    const roles = await this.rolesRepository.findMany();
    return roles.map(toPublicRole);
  }

  async listPermissions() {
    const permissions = await this.rolesRepository.findPermissions();
    return permissions.map((p) => ({ id: p.id, key: p.key, action: p.action, subject: p.subject }));
  }

  async create(input: CreateRole, actorId: string) {
    const existing = await this.rolesRepository.findByKey(input.key);
    if (existing) throw Errors.roleKeyTaken();

    const role = await this.rolesRepository.create(input);
    await this.auditLog.record({
      actorId,
      action: "role.create",
      subjectType: "Role",
      subjectId: role.id,
      changes: input as unknown as Prisma.InputJsonObject,
    });
    return toPublicRole(role);
  }

  async update(id: string, input: UpdateRole, actorId: string) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) throw Errors.roleNotFound();

    const role = await this.rolesRepository.update(id, input);
    if (input.permissionIds) await this.abilityFactory.invalidateForRole(id);

    await this.auditLog.record({
      actorId,
      action: "role.update",
      subjectType: "Role",
      subjectId: id,
      changes: input as unknown as Prisma.InputJsonObject,
    });
    return toPublicRole(role);
  }

  async delete(id: string, actorId: string): Promise<void> {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) throw Errors.roleNotFound();
    if (existing.isSystem) throw Errors.roleSystemImmutable();
    if (existing.users.length > 0) throw Errors.roleInUse(existing.users.length);

    await this.rolesRepository.delete(id);
    await this.auditLog.record({ actorId, action: "role.delete", subjectType: "Role", subjectId: id });
  }
}
