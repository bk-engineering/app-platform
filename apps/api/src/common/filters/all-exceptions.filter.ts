import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ZodValidationException } from "nestjs-zod";
import { PinoLogger } from "nestjs-pino";
import type { ZodError } from "zod";
import type { Request, Response } from "express";
import type { ErrorEnvelope } from "@app-platform/contracts";
import { AppException } from "../errors/app.exception";
import { getTraceId } from "../trace/trace-context";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, code, message, details } = classify(exception);

    const envelope: ErrorEnvelope = {
      code,
      message,
      traceId: getTraceId(),
      timestamp: new Date().toISOString(),
      // route pattern, not the raw URL, so real ids don't leak into logs
      path: `${req.method} ${req.route?.path ?? req.path}`,
      details,
    };

    // 5xx = our bug -> error + stack. 4xx = caller's mistake -> just warn.
    if (status >= 500) {
      this.logger.error({ err: exception, ...envelope }, "unhandled exception");
    } else {
      this.logger.warn(envelope, "request failed");
    }

    // lets the client tell "token expired, refresh" apart from "no token at all"
    if (status === HttpStatus.UNAUTHORIZED) {
      res.setHeader("WWW-Authenticate", 'Bearer realm="api", error="invalid_token"');
    }

    res.status(status).json(envelope);
  }
}

function classify(e: unknown) {
  if (e instanceof ZodValidationException) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: "VALIDATION_FAILED",
      message: "Request failed validation",
      details: (e.getZodError() as ZodError).issues.map((i) => ({
        field: i.path.join(".") || null,
        code: `validation.${i.code}`,
        message: i.message,
      })),
    };
  }

  if (e instanceof AppException) {
    return { status: e.getStatus(), code: e.code, message: e.message, details: e.details };
  }

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002")
      return { status: HttpStatus.CONFLICT, code: "RESOURCE_CONFLICT", message: "Resource already exists", details: [] };
    if (e.code === "P2025")
      return { status: HttpStatus.NOT_FOUND, code: "RESOURCE_NOT_FOUND", message: "Resource not found", details: [] };
  }

  if (e instanceof HttpException) {
    // HttpExceptions Nest throws itself (router 404, guard 401) — normalize the shape
    return { status: e.getStatus(), code: httpStatusToCode(e.getStatus()), message: e.message, details: [] };
  }

  // everything else is our bug — never let internal details leak out
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
    details: [],
  };
}

function httpStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return "AUTH_TOKEN_INVALID";
    case HttpStatus.FORBIDDEN:
      return "AUTHZ_FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "RESOURCE_NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "RESOURCE_CONFLICT";
    default:
      return "INTERNAL_ERROR";
  }
}
