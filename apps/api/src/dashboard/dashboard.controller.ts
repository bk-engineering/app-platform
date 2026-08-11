import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { CheckPolicies } from "../auth/ability/policies.guard";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { Errors } from "../common/errors/app.exception";
import { UsersService } from "../users/users.service";

// the "auth" bucket (5 req/60s) is meant for login attempts only — see health.controller.ts
@ApiTags("dashboard")
@SkipThrottle({ auth: true })
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse()
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("read", "User"))
  @Get("summary")
  summary(@Req() req: AuthenticatedRequest) {
    // org-wide numbers require unconditional read access — "read own" alone isn't enough
    if (!this.usersService.canReadAllUsers(req.ability)) throw Errors.forbidden("read", "dashboard summary");
    return this.usersService.summary();
  }
}
