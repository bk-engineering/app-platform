import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { getTraceId } from "../common/trace/trace-context";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /** best-effort — a logging failure should never fail the request that triggered it */
  async record(input: {
    actorId: string | null;
    action: string;
    subjectType: string;
    subjectId?: string | null;
    changes?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          subjectType: input.subjectType,
          subjectId: input.subjectId ?? null,
          changes: input.changes as Prisma.InputJsonValue | undefined,
          traceId: getTraceId(),
        },
      });
    } catch {
      // audit logging is observability, not correctness — swallow and move on
    }
  }

  async list(limit: number) {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: { select: { displayName: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorName: row.actor?.displayName ?? null,
      action: row.action,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
