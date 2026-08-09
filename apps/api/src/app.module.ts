import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { v7 as uuidv7 } from "uuid";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { HealthController } from "./health.controller";
import { TraceIdMiddleware } from "./common/trace/trace-id.middleware";
import { getTraceId, getUserId } from "./common/trace/trace-context";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TimingInterceptor } from "./common/interceptors/timing.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
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
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // must run before LoggerModule's genReqId, or every request gets "no-trace"
    consumer.apply(TraceIdMiddleware).forRoutes("*");
  }
}
