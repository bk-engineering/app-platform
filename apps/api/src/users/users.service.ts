import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

function toPublicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return toPublicUser(user);
  }

  async create(input: CreateUser) {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    });
    return toPublicUser(user);
  }
}
