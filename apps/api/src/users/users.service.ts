import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";

function toPublicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByIdOrThrow(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");
    return toPublicUser(user);
  }

  async create(input: CreateUser) {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersRepository.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });
    return toPublicUser(user);
  }
}
