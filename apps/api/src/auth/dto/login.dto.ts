import { createZodDto } from "nestjs-zod";
import { AuthTokensSchema, LoginSchema, RefreshTokenSchema } from "@app-platform/contracts";

export class LoginDto extends createZodDto(LoginSchema) {}
export class AuthTokensDto extends createZodDto(AuthTokensSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
