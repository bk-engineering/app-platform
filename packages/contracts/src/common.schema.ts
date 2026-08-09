import { z } from "zod";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  });
}

export const ClientErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(2000),
  userAgent: z.string().max(500).optional(),
  traceId: z.string().optional(),
});
export type ClientError = z.infer<typeof ClientErrorSchema>;
