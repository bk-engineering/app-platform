import { Injectable } from "@nestjs/common";
import { createMongoAbility } from "@casl/ability";
import { AbilityRulesSchema } from "@app-platform/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { AppAbility } from "./ability.types";

@Injectable()
export class AbilityFactory {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string): Promise<AppAbility> {
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

    return createMongoAbility<AppAbility>(rules);
  }
}

/** replaces "${user.id}" placeholders with the real value — only that one path is allowlisted */
function interpolate(conditions: unknown, ctx: { user: { id: string } }): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(conditions).replace(/"\$\{user\.id\}"/g, JSON.stringify(ctx.user.id)),
  ) as Record<string, unknown>;
}
