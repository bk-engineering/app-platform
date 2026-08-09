import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiSecurity, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { AuthService } from "./auth.service";
import { TokenRequestDto } from "./dto/token-request.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiConsumes("application/x-www-form-urlencoded")
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
  @Get("me")
  me(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
      // raw rules, not pre-baked booleans — the client decides what to ask
      rules: req.ability.rules,
    };
  }
}
