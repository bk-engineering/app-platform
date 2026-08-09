import { createZodDto } from "nestjs-zod";
import { ErrorEnvelopeSchema } from "@app-platform/contracts";

export class ErrorEnvelopeDto extends createZodDto(ErrorEnvelopeSchema) {}
