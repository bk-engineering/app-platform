import { createZodDto } from "nestjs-zod";
import { TokenRequestSchema, TokenResponseSchema } from "@app-platform/contracts";

export class TokenRequestDto extends createZodDto(TokenRequestSchema) {}
export class TokenResponseDto extends createZodDto(TokenResponseSchema) {}
