import { createZodDto } from "nestjs-zod";
import { UpdateUserSchema } from "@app-platform/contracts";

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
