import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { v7 as uuidv7 } from "uuid";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { HealthController } from "./health.controller";
import { ClientErrorsController } from "./common/client-errors/client-errors.controller";
import { TraceIdMiddleware } from "./common/trace/trace-id.middleware";
import { getTraceId, getUserId } from "./common/trace/trace-context";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TimingInterceptor } from "./common/interceptors/timing.interceptor";
import { validateEnv } from "./config/env.validate";
import type { Env } from "./config/env.schema";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
      { name: "auth", ttl: 60_000, limit: 5 },
    ]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get("LOG_LEVEL", { infer: true }),
          // reuse the id TraceIdMiddleware already put on the response — never mint our own
          genReqId: (req, res) => {
            const id = (req.headers["x-request-id"] as string) ?? uuidv7();
            res.setHeader("x-request-id", id);
            return id;
          },
          customProps: () => ({ traceId: getTraceId(), userId: getUserId() }),
          redact: {
            paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
            remove: true,
          },
          transport:
            config.get("NODE_ENV", { infer: true }) === "production"
              ? undefined
              : { target: "pino-pretty", options: { singleLine: true } },
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController, ClientErrorsController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    // throttle before auth/policy guards run — no point checking identity on a request we're dropping anyway
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // must run before LoggerModule's genReqId, or every request gets "no-trace"
    consumer.apply(TraceIdMiddleware).forRoutes("*");
  }
}
