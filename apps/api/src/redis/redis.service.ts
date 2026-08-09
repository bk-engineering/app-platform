import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { Env } from "../config/env.schema";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;

  constructor(configService: ConfigService<Env, true>) {
    const url = configService.get("REDIS_URL", { infer: true });
    // REDIS_URL is optional — readiness just reports redis as "not configured" when absent
    this.client = url
      ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null })
      : null;
  }

  async ping(): Promise<void> {
    if (!this.client) throw new Error("REDIS_URL is not configured");
    if (this.client.status === "wait") await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
