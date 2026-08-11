import { describe, expect, it, vi } from "vitest";
import { RefreshTokenService } from "./refresh-token.service";

function fakePrisma(overrides: Partial<{ updateMany: ReturnType<typeof vi.fn> }> = {}) {
  return {
    refreshToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      ...overrides,
    },
  };
}

describe("RefreshTokenService", () => {
  it("revoke() marks only the row matching the presented token's hash as revoked", async () => {
    const prisma = fakePrisma();
    const service = new RefreshTokenService(prisma as never);

    await service.revoke("some-refresh-token");

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String), revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("revokeAllForUser() revokes every non-revoked row for that user, not just one family", async () => {
    const prisma = fakePrisma();
    const service = new RefreshTokenService(prisma as never);

    await service.revokeAllForUser("u1");

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
