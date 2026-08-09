import { applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiResponse } from "@nestjs/swagger";
import { ErrorEnvelopeDto } from "../errors/error-envelope.dto";

export const ApiErrorResponses = () =>
  applyDecorators(
    ApiExtraModels(ErrorEnvelopeDto),
    ApiResponse({ status: 422, description: "Validation failed", type: ErrorEnvelopeDto }),
    ApiResponse({ status: 401, description: "Unauthenticated", type: ErrorEnvelopeDto }),
    ApiResponse({ status: 403, description: "Forbidden", type: ErrorEnvelopeDto }),
    ApiResponse({ status: 500, description: "Internal error", type: ErrorEnvelopeDto }),
  );
