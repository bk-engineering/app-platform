import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface PermissionSeed {
  key: string;
  action: string;
  subject: string;
  conditions?: Record<string, unknown>;
  fields?: string[];
}

// one row per CASL rule. "any" vs "own" get separate rows even when action+subject match,
// because their `conditions` differ — see the Permission.key comment in schema.prisma.
const PERMISSIONS: PermissionSeed[] = [
  { key: "manage:all", action: "manage", subject: "all" },

  { key: "create:User", action: "create", subject: "User" },
  { key: "read:User:any", action: "read", subject: "User" },
  { key: "read:User:own", action: "read", subject: "User", conditions: { id: "${user.id}" } },
  {
    key: "update:User:any",
    action: "update",
    subject: "User",
    conditions: { id: { $ne: "${user.id}" } },
    fields: ["displayName", "email", "status"],
  },
  {
    key: "update:User:own",
    action: "update",
    subject: "User",
    conditions: { id: "${user.id}" },
    fields: ["displayName", "avatarFileId", "locale", "theme"],
  },
  { key: "delete:User:any", action: "delete", subject: "User", conditions: { id: { $ne: "${user.id}" } } },

  { key: "read:Role", action: "read", subject: "Role" },
  { key: "read:Permission", action: "read", subject: "Permission" },

  { key: "create:File", action: "create", subject: "File" },
  { key: "read:File:any", action: "read", subject: "File" },
  { key: "read:File:own", action: "read", subject: "File", conditions: { uploadedById: "${user.id}" } },
  { key: "delete:File:any", action: "delete", subject: "File" },
  { key: "delete:File:own", action: "delete", subject: "File", conditions: { uploadedById: "${user.id}" } },
];

const ROLES = [
  { key: "admin", name: "ผู้ดูแลระบบ", isSystem: true },
  { key: "manager", name: "ผู้จัดการ", isSystem: true },
  { key: "member", name: "สมาชิก", isSystem: true },
] as const;

// admin doesn't need every row explicitly — "manage all" already implies everything else
const ROLE_PERMISSIONS: Record<(typeof ROLES)[number]["key"], string[]> = {
  admin: ["manage:all"],
  manager: [
    "create:User",
    "read:User:any",
    "update:User:any",
    "delete:User:any",
    "read:Role",
    "read:Permission",
    "create:File",
    "read:File:any",
    "delete:File:any",
  ],
  member: ["read:User:own", "update:User:own", "create:File", "read:File:own", "delete:File:own"],
};

async function seedRbac() {
  const permissionIds = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { key: p.key },
      update: {
        action: p.action,
        subject: p.subject,
        conditions: p.conditions as Prisma.InputJsonValue | undefined,
        fields: p.fields ?? [],
      },
      create: {
        key: p.key,
        action: p.action,
        subject: p.subject,
        conditions: p.conditions as Prisma.InputJsonValue | undefined,
        fields: p.fields ?? [],
      },
    });
    permissionIds.set(p.key, row.id);
  }

  const roleIds = new Map<string, string>();
  for (const r of ROLES) {
    const row = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, isSystem: r.isSystem },
      create: { key: r.key, name: r.name, isSystem: r.isSystem },
    });
    roleIds.set(r.key, row.id);
  }

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIds.get(roleKey)!;
    for (const permissionKey of permissionKeys) {
      const permissionId = permissionIds.get(permissionKey)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  return roleIds;
}

async function upsertUserWithRole(
  roleIds: Map<string, string>,
  input: { email: string; displayName: string; password: string; roleKey: string },
) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: { email: input.email, displayName: input.displayName, passwordHash },
  });

  const roleId = roleIds.get(input.roleKey)!;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId } },
    update: {},
    create: { userId: user.id, roleId },
  });

  return user;
}

async function main() {
  const roleIds = await seedRbac();

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed");
  }
  await upsertUserWithRole(roleIds, {
    email: adminEmail,
    displayName: "Admin",
    password: adminPassword,
    roleKey: "admin",
  });

  // sample accounts for local testing only — never on production
  if (process.env.NODE_ENV !== "production") {
    await upsertUserWithRole(roleIds, {
      email: "demo@example.com",
      displayName: "Demo Manager",
      password: "password123",
      roleKey: "manager",
    });
    await upsertUserWithRole(roleIds, {
      email: "demo-member@example.com",
      displayName: "Demo Member",
      password: "password123",
      roleKey: "member",
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
