import { Injectable } from "@nestjs/common";
import { subject } from "@casl/ability";
import type { CreateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";
import { Errors } from "../common/errors/app.exception";
import type { AppAbility } from "../auth/ability/ability.types";

function toPublicUser<T extends { passwordHash: string | null }>(user: T) {
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
    if (!user) throw Errors.userNotFound();
    return toPublicUser(user);
  }

  /** instance-level CASL check — unreadable is a 404, not a 403, so ids can't be probed */
  async findVisible(id: string, ability: AppAbility) {
    const user = await this.usersRepository.findById(id);
    if (!user || !ability.can("read", subject("User", user))) throw Errors.userNotFound();
    return toPublicUser(user);
  }

  async create(input: CreateUser) {
    const existing = await this.findByEmail(input.email);
    if (existing) throw Errors.emailTaken();

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersRepository.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });
    return toPublicUser(user);
  }
}
