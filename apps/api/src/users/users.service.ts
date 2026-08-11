import { Injectable } from "@nestjs/common";
import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";
import type { Prisma } from "@prisma/client";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { CreateUser, PaginationQuery, UpdateMe, UpdateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { UsersRepository, type UserWithRoles } from "./users.repository";
import { AuditLogService } from "../audit-log/audit-log.service";
import { Errors } from "../common/errors/app.exception";
import { getTraceId } from "../common/trace/trace-context";
import type { AppAbility } from "../auth/ability/ability.types";

function toPublicUser(user: UserWithRoles) {
  const { passwordHash: _passwordHash, roles, ...rest } = user;
  return {
    ...rest,
    roles: roles.map((r) => ({ id: r.role.id, key: r.role.key, name: r.role.name })),
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLog: AuditLogService,
    @InjectPinoLogger(UsersService.name) private readonly logger: PinoLogger,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByIdOrThrow(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw Errors.userNotFound();
    return toPublicUser(user);
  }

  /** instance-level CASL check — unreadable is a 404, not a 403, so ids can't be probed */
  async findVisible(id: string, ability: AppAbility) {
    const user = await this.usersRepository.findById(id);
    if (!user || !ability.can("read", subject("User", user))) throw Errors.userNotFound();
    return toPublicUser(user);
  }

  async update(id: string, ability: AppAbility, actorId: string, input: UpdateUser | UpdateMe) {
    const existing = await this.usersRepository.findById(id);
    if (!existing || !ability.can("read", subject("User", existing))) throw Errors.userNotFound();

    const target = subject("User", existing);
    for (const field of Object.keys(input)) {
      if (!ability.can("update", target, field)) throw Errors.forbidden("update", "User");
    }

    if ("email" in input && input.email && input.email !== existing.email) {
      const taken = await this.usersRepository.findByEmail(input.email);
      if (taken) throw Errors.emailTaken();
    }

    const user = await this.usersRepository.update(id, input);
    await this.auditLog.record({
      actorId,
      action: "user.update",
      subjectType: "User",
      subjectId: id,
      changes: input,
    });
    return toPublicUser(user);
  }

  async delete(id: string, ability: AppAbility, actorId: string): Promise<void> {
    const existing = await this.usersRepository.findById(id);
    if (!existing || !ability.can("delete", subject("User", existing))) throw Errors.userNotFound();

    if (this.usersRepository.hasRole(existing, "admin")) {
      const remainingAdmins = await this.usersRepository.countByRoleKey("admin", id);
      if (remainingAdmins < 1) throw Errors.userLastAdmin();
    }

    await this.usersRepository.softDelete(id);
    await this.auditLog.record({ actorId, action: "user.delete", subjectType: "User", subjectId: id });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw Errors.userNotFound();
    if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw Errors.invalidCurrentPassword();
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.setPasswordHash(id, passwordHash);
    this.logger.info({ traceId: getTraceId(), userId: id }, "password changed");
  }

  async list(ability: AppAbility, query: PaginationQuery) {
    // our rules only ever use plain Mongo-style conditions ({field: value} / {$ne, $in, ...}),
    // which @casl/prisma's `accessibleBy` accepts fine at runtime — the type mismatch is against
    // its stricter PrismaQuery type, which our MongoAbility doesn't declare but is compatible with.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // accessibleBy returns `undefined` (not `{}`) for an unconditional "manage all" rule —
    // normalize to `{}` so it composes safely inside the search AND below
    const accessible = ((accessibleBy(ability as any, "read") as any).User as Prisma.UserWhereInput) ?? {};
    const where: Prisma.UserWhereInput = query.search
      ? {
          AND: [
            accessible,
            {
              OR: [
                { displayName: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
              ],
            },
          ],
        }
      : accessible;
    const [items, total] = await this.usersRepository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return { items: items.map(toPublicUser), total, page: query.page, limit: query.limit };
  }

  async create(input: CreateUser) {
    const existing = await this.findByEmail(input.email);
    if (existing) throw Errors.emailTaken();

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersRepository.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });
    this.logger.info({ traceId: getTraceId(), userId: user.id }, "user registered");
    return toPublicUser(user);
  }

  /** unconditional (no per-row `conditions`) read access — distinguishes "sees the org" from "sees only self" */
  canReadAllUsers(ability: AppAbility): boolean {
    return ability.rulesFor("read", "User").some((rule) => !rule.conditions && !rule.inverted);
  }

  async summary() {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.usersRepository.countTotal(),
      this.usersRepository.countByStatus("ACTIVE"),
      this.usersRepository.countByStatus("INACTIVE"),
    ]);
    return { totalUsers, activeUsers, inactiveUsers };
  }
}
