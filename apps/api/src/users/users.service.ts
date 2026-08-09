import { Injectable } from "@nestjs/common";
import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";
import type { Prisma } from "@prisma/client";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { CreateUser, PaginationQuery, UpdateUser } from "@app-platform/contracts";
import bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";
import { Errors } from "../common/errors/app.exception";
import { getTraceId } from "../common/trace/trace-context";
import type { AppAbility } from "../auth/ability/ability.types";

function toPublicUser<T extends { passwordHash: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectPinoLogger(UsersService.name) private readonly logger: PinoLogger,
  ) {}

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

  async update(id: string, ability: AppAbility, input: UpdateUser) {
    const existing = await this.usersRepository.findById(id);
    if (!existing || !ability.can("update", subject("User", existing))) throw Errors.userNotFound();

    const user = await this.usersRepository.update(id, input);
    return toPublicUser(user);
  }

  async list(ability: AppAbility, query: PaginationQuery) {
    // our rules only ever use plain Mongo-style conditions ({field: value} / {$ne, $in, ...}),
    // which @casl/prisma's `accessibleBy` accepts fine at runtime — the type mismatch is against
    // its stricter PrismaQuery type, which our MongoAbility doesn't declare but is compatible with.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = (accessibleBy(ability as any, "read") as any).User as Prisma.UserWhereInput;
    const [items, total] = await this.usersRepository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return { items: items.map(toPublicUser), total, page: query.page, limit: query.limit };
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
    this.logger.info({ traceId: getTraceId(), userId: user.id }, "user registered");
    return toPublicUser(user);
  }
}
