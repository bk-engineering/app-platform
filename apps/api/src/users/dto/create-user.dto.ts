import { createZodDto } from "nestjs-zod";
import { CreateUserSchema, UserSchema } from "@app-platform/contracts";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UserDto extends createZodDto(UserSchema) {}
