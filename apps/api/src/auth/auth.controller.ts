import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { AuthService } from "./auth.service";
import { TokenRequestDto, TokenResponseDto } from "./dto/token-request.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @ApiConsumes("application/x-www-form-urlencoded")
  @ApiOkResponse({ type: TokenResponseDto })
  @ApiErrorResponses()
  @Post("token")
  token(@Body() body: TokenRequestDto, @Req() req: Request) {
    const meta = { userAgent: req.headers["user-agent"], ip: req.ip };
    // TokenRequestSchema's .refine() already guarantees these fields are present per grant_type
    if (body.grant_type === "password") {
      return this.authService.login(body.username!, body.password!, meta);
    }
    return this.authService.refresh(body.refresh_token!, meta);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @Get("me")
  me(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
      // raw rules, not pre-baked booleans — the client decides what to ask
      rules: req.ability.rules,
    };
  }
}
