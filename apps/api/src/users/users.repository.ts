import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type CreateUserRow = {
  email: string;
  displayName: string;
  passwordHash: string;
};

type UpdateUserRow = {
  displayName?: string;
  email?: string;
  status?: "ACTIVE" | "INACTIVE";
  locale?: string;
  theme?: string;
  roleIds?: string[];
};

const withRoles = { roles: { include: { role: true } } } satisfies Prisma.UserInclude;
export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof withRoles }>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null }, include: withRoles });
  }

  findById(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: withRoles });
  }

  /** every user needs at least one role or CASL grants them nothing at all — "member" is the baseline */
  create(data: CreateUserRow): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: { ...data, roles: { create: { role: { connect: { key: "member" } } } } },
      include: withRoles,
    });
  }

  update(id: string, data: UpdateUserRow): Promise<UserWithRoles> {
    const { roleIds, ...rest } = data;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(roleIds ? { roles: { deleteMany: {}, create: roleIds.map((roleId) => ({ roleId })) } } : {}),
      },
      include: withRoles,
    });
  }

  setPasswordHash(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async list(where: Prisma.UserWhereInput, skip: number, take: number) {
    const scoped: Prisma.UserWhereInput = { AND: [where, { deletedAt: null }] };
    return this.prisma.$transaction([
      this.prisma.user.findMany({ where: scoped, orderBy: { createdAt: "desc" }, skip, take, include: withRoles }),
      this.prisma.user.count({ where: scoped }),
    ]);
  }

  /** counts active holders of a role, optionally excluding one user — used for the last-admin guard */
  countByRoleKey(roleKey: string, excludeUserId?: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        id: excludeUserId ? { not: excludeUserId } : undefined,
        roles: { some: { role: { key: roleKey } } },
      },
    });
  }

  countTotal(): Promise<number> {
    return this.prisma.user.count({ where: { deletedAt: null } });
  }

  countByStatus(status: "ACTIVE" | "INACTIVE"): Promise<number> {
    return this.prisma.user.count({ where: { deletedAt: null, status } });
  }

  hasRole(user: UserWithRoles, roleKey: string): boolean {
    return user.roles.some((r) => r.role.key === roleKey);
  }
}
