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

  // caching is an optimization, not a correctness requirement — a Redis hiccup falls
  // back to "no cache" (get: null, set/del: no-op) rather than breaking the caller
  private async safely<T>(fn: (client: Redis) => Promise<T>): Promise<T | undefined> {
    if (!this.client) return undefined;
    try {
      if (this.client.status === "wait") await this.client.connect();
      return await fn(this.client);
    } catch {
      return undefined;
    }
  }

  /** returns null on cache miss, when Redis isn't configured, or on a Redis error */
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.safely((client) => client.get(key));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJSON(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.safely((client) => client.set(key, JSON.stringify(value), "EX", ttlSeconds));
  }

  async del(key: string): Promise<void> {
    await this.safely((client) => client.del(key));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
