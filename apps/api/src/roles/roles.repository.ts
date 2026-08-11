import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const withCounts = { permissions: true, users: true } as const;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.prisma.role.findMany({ include: withCounts, orderBy: { createdAt: "asc" } });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({ where: { id }, include: withCounts });
  }

  findByKey(key: string) {
    return this.prisma.role.findUnique({ where: { key } });
  }

  findPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ subject: "asc" }, { action: "asc" }] });
  }

  async create(input: { key: string; name: string; permissionIds: string[] }) {
    const role = await this.prisma.role.create({
      data: {
        key: input.key,
        name: input.name,
        permissions: { create: input.permissionIds.map((permissionId) => ({ permissionId })) },
      },
      include: withCounts,
    });
    return role;
  }

  async update(id: string, input: { name?: string; permissionIds?: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
      if (input.name !== undefined) {
        await tx.role.update({ where: { id }, data: { name: input.name } });
      }
      return tx.role.findUniqueOrThrow({ where: { id }, include: withCounts });
    });
  }

  delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
