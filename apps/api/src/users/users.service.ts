import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(input: CreateUser) {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    });
  }
}
