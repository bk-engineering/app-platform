import { Body, Controller, Post } from "@nestjs/common";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { TokenRequestDto } from "./dto/token-request.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiConsumes("application/x-www-form-urlencoded")
  @Post("token")
  token(@Body() body: TokenRequestDto) {
    // TokenRequestSchema's .refine() already guarantees these fields are present per grant_type
    if (body.grant_type === "password") {
      return this.authService.login(body.username!, body.password!);
    }
    return this.authService.refresh(body.refresh_token!);
  }
}
