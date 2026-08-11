import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { CheckPolicies } from "../auth/ability/policies.guard";
import { ApiErrorResponses } from "../common/decorators/api-error-responses.decorator";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";
import { RolesService } from "./roles.service";
import { CreateRoleDto, PermissionDto, RoleDto, UpdateRoleDto } from "./dto/role.dto";

// the "auth" bucket (5 req/60s) is meant for login attempts only — see health.controller.ts
@ApiTags("roles")
@SkipThrottle({ auth: true })
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: RoleDto, isArray: true })
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("read", "Role"))
  @Get()
  list() {
    return this.rolesService.list();
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: PermissionDto, isArray: true })
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("read", "Permission"))
  @Get("permissions")
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiCreatedResponse({ type: RoleDto })
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("create", "Role"))
  @Post()
  create(@Body() body: CreateRoleDto, @Req() req: AuthenticatedRequest) {
    return this.rolesService.create(body, req.user!.id);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiOkResponse({ type: RoleDto })
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("update", "Role"))
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateRoleDto, @Req() req: AuthenticatedRequest) {
    return this.rolesService.update(id, body, req.user!.id);
  }

  @ApiBearerAuth("access-token")
  @ApiSecurity("oauth2")
  @ApiErrorResponses()
  @CheckPolicies((ability) => ability.can("delete", "Role"))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.rolesService.delete(id, req.user!.id);
  }
}
