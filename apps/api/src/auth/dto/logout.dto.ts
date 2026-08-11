import { createZodDto } from "nestjs-zod";
import { LogoutSchema } from "@app-platform/contracts";

export class LogoutDto extends createZodDto(LogoutSchema) {}
