import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { TokenRequestDto, TokenResponseDto } from "./dto/token-request.dto";
import { LogoutDto } from "./dto/logout.dto";
import { ChangePasswordDto, UpdateMeDto } from "./dto/update-me.dto";

// the "auth" bucket (5 req/60s) should gate the login/refresh endpoint only — every other
// route here (me, logout, change-password) needs normal traffic levels, not login-attempt limits
@ApiTags("auth")
@SkipThrottle({ auth: true })
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

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
  async me(@Req() req: AuthenticatedRequest) {
    return {
      user: await this.usersService.findByIdOrThrow(req.user!.id),
      // raw rules, not pre-baked booleans — the client decides what to ask
      rules: req.ability.rules,
    };
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse()
  @ApiErrorResponses()
  @Patch("me")
  updateMe(@Body() body: UpdateMeDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.update(req.user!.id, req.ability, req.user!.id, body);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("change-password")
  async changePassword(@Body() body: ChangePasswordDto, @Req() req: AuthenticatedRequest) {
    await this.usersService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(@Body() body: LogoutDto, @Req() req: AuthenticatedRequest) {
    await this.authService.logout(body.refresh_token, req.user!.id);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout-all")
  async logoutAll(@Req() req: AuthenticatedRequest) {
    await this.authService.logoutAll(req.user!.id);
  }
}
