import { z } from "zod";

export const ErrorDetailSchema = z.object({
  field: z.string().nullable(),
  code: z.string(),
  message: z.string(),
});
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

export const ErrorEnvelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  traceId: z.string(),
  timestamp: z.iso.datetime(),
  path: z.string(),
  details: z.array(ErrorDetailSchema).default([]),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
