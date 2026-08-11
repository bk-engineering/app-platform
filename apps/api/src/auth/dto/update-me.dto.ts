import { createZodDto } from "nestjs-zod";
import { ChangePasswordSchema, UpdateMeSchema } from "@app-platform/contracts";

export class UpdateMeDto extends createZodDto(UpdateMeSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
