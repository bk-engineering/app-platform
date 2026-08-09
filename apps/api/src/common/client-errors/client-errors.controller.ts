import { Controller, HttpCode, HttpStatus, Post, Body } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { createZodDto } from "nestjs-zod";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { ClientErrorSchema } from "@app-platform/contracts";
import { Public } from "../decorators/public.decorator";

class ClientErrorDto extends createZodDto(ClientErrorSchema) {}

@ApiExcludeController()
@Controller("client-errors")
export class ClientErrorsController {
  constructor(@InjectPinoLogger(ClientErrorsController.name) private readonly logger: PinoLogger) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  report(@Body() body: ClientErrorDto) {
    this.logger.error(
      { traceId: body.traceId, url: body.url, userAgent: body.userAgent, stack: body.stack },
      `client error: ${body.message}`,
    );
  }
}
