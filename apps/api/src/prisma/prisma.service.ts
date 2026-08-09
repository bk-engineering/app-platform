import { Injectable } from "@nestjs/common";
import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { getTraceId } from "../common/trace/trace-context";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger) {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      log: [{ emit: "event", level: "query" }],
    } satisfies Prisma.PrismaClientOptions);
  }

  async onModuleInit() {
    // params can carry real user data (email, password hash) — only log the query + duration
    this.$on("query" as never, (e: Prisma.QueryEvent) => {
      this.logger.debug({ traceId: getTraceId(), query: e.query, durationMs: e.duration }, "prisma query");
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
