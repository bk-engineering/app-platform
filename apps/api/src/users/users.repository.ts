import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type CreateUserRow = {
  email: string;
  displayName: string;
  passwordHash: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserRow): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: { displayName?: string }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async list(where: Prisma.UserWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
  }
}
