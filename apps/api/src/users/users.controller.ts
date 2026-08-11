import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { PaginationQuerySchema } from "@app-platform/contracts";
import { createZodDto } from "nestjs-zod";
import { CheckPolicies } from "../auth/ability/policies.guard";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { UsersService } from "./users.service";
import { CreateUserDto, UserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

// the "auth" bucket (5 req/60s) is meant for login attempts only — see health.controller.ts
@ApiTags("users")
@SkipThrottle({ auth: true })
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
  @ApiOkResponse({ type: UserDto, isArray: true })
  @ApiErrorResponses()
  @Get()
  list(@Query() query: PaginationQueryDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.list(req.ability, query);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: UserDto })
  @ApiErrorResponses()
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.findVisible(id, req.ability);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: UserDto })
  @ApiErrorResponses()
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.update(id, req.ability, req.user!.id, body);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.usersService.delete(id, req.ability, req.user!.id);
  }
}
