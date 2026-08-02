import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findByIdOrThrow(id);
  }
}
