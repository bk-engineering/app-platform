import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";
import { tap } from "rxjs/operators";
import { getTraceId } from "../trace/trace-context";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const start = process.hrtime.bigint();
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        this.logger.info(
          {
            traceId: getTraceId(),
            method: req.method,
            path: req.route?.path ?? req.path,
            status: res.statusCode,
            durationMs: Math.round(durationMs * 100) / 100,
          },
          "request handled",
        );
      }),
    );
  }
}
