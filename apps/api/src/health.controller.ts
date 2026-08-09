import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "./common/decorators/public.decorator";
import { PrismaService } from "./prisma/prisma.service";
import { RedisService } from "./redis/redis.service";

@ApiExcludeController()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** alias of /health/live — kept so existing healthcheck config doesn't break */
  @Public()
  @Get()
  check() {
    return this.live();
  }

  @Public()
  @Get("live")
  live() {
    return { status: "ok", checkedAt: new Date().toISOString() };
  }

  @Public()
  @Get("ready")
  async ready(@Res({ passthrough: true }) res: Response) {
    const [postgres, redis] = await Promise.all([this.checkPostgres(), this.checkRedis()]);
    const ok = postgres.ok && redis.ok;

    // orchestrators decide from the HTTP status, not the body — 200 always means "route traffic here"
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: ok ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      checks: { postgres, redis },
    };
  }

  private async checkPostgres() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false };
    }
  }

  private async checkRedis() {
    const start = Date.now();
    try {
      await this.redis.ping();
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false };
    }
  }
}
