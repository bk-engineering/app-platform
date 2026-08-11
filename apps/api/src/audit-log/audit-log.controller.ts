import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { AuditLogQuerySchema } from "@app-platform/contracts";
import { createZodDto } from "nestjs-zod";
import { CheckPolicies } from "../auth/ability/policies.guard";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import { AuditLogService } from "./audit-log.service";

class AuditLogQueryDto extends createZodDto(AuditLogQuerySchema) {}

// the "auth" bucket (5 req/60s) is meant for login attempts only — see health.controller.ts
@ApiTags("audit-logs")
@SkipThrottle({ auth: true })
@Controller("audit-logs")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse()
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("read", "AuditLog"))
  @Get()
  list(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.list(query.limit);
  }
}
