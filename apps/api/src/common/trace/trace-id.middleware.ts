import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { v7 as uuidv7 } from "uuid";
import { traceStorage } from "./trace-context";

export const TRACE_HEADER = "x-request-id";

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header(TRACE_HEADER);
    // trust the caller's id only if it looks like a UUID — otherwise mint a fresh one
    const traceId = incoming && /^[0-9a-f-]{36}$/i.test(incoming) ? incoming : uuidv7();

    res.setHeader(TRACE_HEADER, traceId);
    traceStorage.run({ traceId }, () => next());
  }
}
