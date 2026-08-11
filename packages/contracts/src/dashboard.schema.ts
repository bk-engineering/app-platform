import { z } from "zod";

export const DashboardSummarySchema = z.object({
  totalUsers: z.number().int().min(0),
  activeUsers: z.number().int().min(0),
  inactiveUsers: z.number().int().min(0),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
