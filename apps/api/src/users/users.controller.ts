import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "../auth/ability/policies.guard";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { UsersService } from "./users.service";
import { CreateUserDto, UserDto } from "./dto/create-user.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiCreatedResponse({ type: UserDto })
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("create", "User"))
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: UserDto })
  @ApiErrorResponses()
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.findVisible(id, req.ability);
  }
}
