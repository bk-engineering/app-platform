import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { Errors } from "../common/errors/app.exception";
import { getTraceId } from "../common/trace/trace-context";

/** SHA-256, not bcrypt — this is a random 256-bit value we generated, nothing to brute-force */
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const TTL_DAYS = 7;

interface TokenMeta {
  userAgent?: string;
  ip?: string;
}

type RotateOutcome =
  | { kind: "invalid" }
  | { kind: "reused"; familyId: string; userId: string }
  | { kind: "rotated"; userId: string; refreshToken: string };

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async issue(userId: string, familyId: string, meta: TokenMeta) {
    const token = randomBytes(32).toString("base64url");

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + TTL_DAYS * 86_400_000),
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip,
      },
    });

    return token;
  }

  newFamilyId() {
    return uuidv7();
  }

  /** revokes the single refresh token presented — used by logout */
  async revoke(presented: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash(presented), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** revokes every family belonging to a user — used by logout-all and password change */
  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotate(presented: string, meta: TokenMeta) {
    const tokenHash = hash(presented);

    // the happy path (check + revoke-old + issue-new) is one atomic transaction so two
    // concurrent refreshes of the same token can't both succeed. Reuse detection is
    // deliberately handled *outside* it below — throwing inside $transaction rolls back
    // everything in it, including the family-wide revocation we want to keep.
    const outcome: RotateOutcome = await this.prisma.$transaction(async (tx) => {
      const row = await tx.refreshToken.findUnique({ where: { tokenHash } });

      // completely unknown — forged, or already purged
      if (!row) return { kind: "invalid" };
      // known but already used — more than one copy exists in the world
      if (row.revokedAt) return { kind: "reused", familyId: row.familyId, userId: row.userId };
      if (row.expiresAt < new Date()) return { kind: "invalid" };

      await tx.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });

      const token = randomBytes(32).toString("base64url");
      await tx.refreshToken.create({
        data: {
          userId: row.userId,
          familyId: row.familyId,
          tokenHash: hash(token),
          expiresAt: new Date(Date.now() + TTL_DAYS * 86_400_000),
          userAgent: meta.userAgent?.slice(0, 255),
          ip: meta.ip,
        },
      });

      return { kind: "rotated", userId: row.userId, refreshToken: token };
    });

    if (outcome.kind === "invalid") throw Errors.refreshInvalid();

    if (outcome.kind === "reused") {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: outcome.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn({
        traceId: getTraceId(),
        userId: outcome.userId,
        familyId: outcome.familyId,
        msg: "refresh token reuse detected — revoking family",
      });
      throw Errors.refreshReused();
    }

    return { userId: outcome.userId, refreshToken: outcome.refreshToken };
  }
}
