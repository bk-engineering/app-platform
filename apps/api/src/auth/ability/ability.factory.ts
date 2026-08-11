import { Injectable } from "@nestjs/common";
import { createMongoAbility } from "@casl/ability";
import { AbilityRulesSchema, type RawRule } from "@app-platform/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import type { AppAbility } from "./ability.types";

const CACHE_TTL_SECONDS = 300;
const cacheKey = (userId: string) => `ability:${userId}`;

@Injectable()
export class AbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async forUser(userId: string): Promise<AppAbility> {
    const cached = await this.redis.getJSON<RawRule[]>(cacheKey(userId));
    if (cached) return createMongoAbility<AppAbility>(AbilityRulesSchema.parse(cached));

    const rows = await this.prisma.permission.findMany({
      where: { roles: { some: { role: { users: { some: { userId } } } } } },
    });

    const rules = AbilityRulesSchema.parse(
      rows.map((row) => ({
        action: row.action,
        subject: row.subject,
        fields: row.fields.length ? row.fields : undefined,
        conditions: row.conditions
          ? interpolate(row.conditions, { user: { id: userId } })
          : undefined,
      })),
    );

    await this.redis.setJSON(cacheKey(userId), rules, CACHE_TTL_SECONDS);
    return createMongoAbility<AppAbility>(rules);
  }

  /** call after a role's permissions change so holders don't keep stale cached rules for CACHE_TTL_SECONDS */
  async invalidateForRole(roleId: string): Promise<void> {
    const holders = await this.prisma.userRole.findMany({ where: { roleId }, select: { userId: true } });
    await Promise.all(holders.map((h) => this.redis.del(cacheKey(h.userId))));
  }
}

/** replaces "${user.id}" placeholders with the real value — only that one path is allowlisted */
function interpolate(conditions: unknown, ctx: { user: { id: string } }): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(conditions).replace(/"\$\{user\.id\}"/g, JSON.stringify(ctx.user.id)),
  ) as Record<string, unknown>;
}
