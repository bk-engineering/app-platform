import { describe, expect, it, vi } from "vitest";
import { createMongoAbility } from "@casl/ability";
import type { AppAbility } from "../auth/ability/ability.types";
import { UsersService } from "./users.service";

function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never;
}

function fakeAuditLog() {
  return { record: vi.fn().mockResolvedValue(undefined) } as never;
}

function fakeRepository(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    ...overrides,
  };
}

const readOwnAbility = (userId: string) =>
  createMongoAbility([{ action: "read", subject: "User", conditions: { id: userId } }]) as AppAbility;

describe("UsersService", () => {
  it("create() hashes the password and returns the user without passwordHash", async () => {
    const repository = fakeRepository({
      create: vi.fn().mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        displayName: "Ann",
        passwordHash: "hashed",
        roles: [],
        createdAt: new Date("2026-01-01"),
      }),
    });
    const service = new UsersService(repository as never, fakeAuditLog(), fakeLogger());

    const result = await service.create({ email: "a@b.com", displayName: "Ann", password: "password123" });

    expect(result).not.toHaveProperty("passwordHash");
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", displayName: "Ann" }),
    );
  });

  it("create() throws when the email is already taken", async () => {
    const repository = fakeRepository({
      findByEmail: vi.fn().mockResolvedValue({ id: "existing" }),
    });
    const service = new UsersService(repository as never, fakeAuditLog(), fakeLogger());

    await expect(
      service.create({ email: "a@b.com", displayName: "Ann", password: "password123" }),
    ).rejects.toMatchObject({ code: "USER_EMAIL_TAKEN" });
  });

  it("findVisible() returns 404-shaped error when the row doesn't exist", async () => {
    const repository = fakeRepository({ findById: vi.fn().mockResolvedValue(null) });
    const service = new UsersService(repository as never, fakeAuditLog(), fakeLogger());

    await expect(service.findVisible("missing", readOwnAbility("u1"))).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });

  it("findVisible() returns 404-shaped error (not 403) when the ability forbids reading the row", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue({ id: "someone-else", email: "x@y.com", roles: [] }),
    });
    const service = new UsersService(repository as never, fakeAuditLog(), fakeLogger());

    // ability only allows reading id "u1" — the row belongs to "someone-else"
    await expect(service.findVisible("someone-else", readOwnAbility("u1"))).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });

  it("findVisible() returns the public user when the ability allows it", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        displayName: "Ann",
        passwordHash: "hashed",
        roles: [],
      }),
    });
    const service = new UsersService(repository as never, fakeAuditLog(), fakeLogger());

    const result = await service.findVisible("u1", readOwnAbility("u1"));

    expect(result).toMatchObject({ id: "u1", email: "a@b.com" });
    expect(result).not.toHaveProperty("passwordHash");
  });
});
