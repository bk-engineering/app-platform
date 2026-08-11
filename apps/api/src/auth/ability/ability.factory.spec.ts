import { describe, expect, it, vi } from "vitest";
import { subject } from "@casl/ability";
import { AbilityFactory } from "./ability.factory";

// mirrors the manager role's rows from apps/api/prisma/seed.ts
const MANAGER_PERMISSION_ROWS = [
  { action: "read", subject: "User", conditions: null, fields: [] },
  {
    action: "update",
    subject: "User",
    conditions: { id: { $ne: "${user.id}" } },
    fields: ["displayName", "email", "status"],
  },
];

function fakePrisma(rows: unknown[]) {
  return { permission: { findMany: vi.fn().mockResolvedValue(rows) } };
}

function fakeRedis(cached: unknown = null) {
  return { getJSON: vi.fn().mockResolvedValue(cached), setJSON: vi.fn().mockResolvedValue(undefined) };
}

describe("AbilityFactory", () => {
  it("forUser() builds an ability from DB rows and caches it when Redis has no entry", async () => {
    const prisma = fakePrisma(MANAGER_PERMISSION_ROWS);
    const redis = fakeRedis(null);
    const factory = new AbilityFactory(prisma as never, redis as never);

    await factory.forUser("u1");

    expect(prisma.permission.findMany).toHaveBeenCalled();
    expect(redis.setJSON).toHaveBeenCalledWith("ability:u1", expect.any(Array), 300);
  });

  it("forUser() serves from Redis without touching the DB on a cache hit", async () => {
    const prisma = fakePrisma(MANAGER_PERMISSION_ROWS);
    const redis = fakeRedis([{ action: "read", subject: "User" }]);
    const factory = new AbilityFactory(prisma as never, redis as never);

    const ability = await factory.forUser("u1");

    expect(prisma.permission.findMany).not.toHaveBeenCalled();
    expect(ability.can("read", "User")).toBe(true);
  });

  it("interpolates ${user.id} into conditions so 'update own' style rules bind to the caller", async () => {
    const prisma = fakePrisma(MANAGER_PERMISSION_ROWS);
    const factory = new AbilityFactory(prisma as never, fakeRedis(null) as never);

    const ability = await factory.forUser("u1");

    // manager can update other users…
    expect(ability.can("update", subject("User", { id: "u2" }))).toBe(true);
    // …but not themselves, since the seeded rule excludes id === user.id
    expect(ability.can("update", subject("User", { id: "u1" }))).toBe(false);
  });

  it("restricts updates to the fields listed on the permission row", async () => {
    const prisma = fakePrisma(MANAGER_PERMISSION_ROWS);
    const factory = new AbilityFactory(prisma as never, fakeRedis(null) as never);

    const ability = await factory.forUser("u1");
    const target = subject("User", { id: "u2" });

    expect(ability.can("update", target, "displayName")).toBe(true);
    // "roles" was never in the seeded fields list — this is what stops self-promotion
    expect(ability.can("update", target, "roles")).toBe(false);
  });

  it("cannot touches subjects with no permission row at all", async () => {
    const prisma = fakePrisma(MANAGER_PERMISSION_ROWS);
    const factory = new AbilityFactory(prisma as never, fakeRedis(null) as never);

    const ability = await factory.forUser("u1");

    expect(ability.can("update", "Role")).toBe(false);
  });
});
