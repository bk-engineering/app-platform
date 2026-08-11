import { useQuery } from "@tanstack/react-query";
import { AuditLogSchema, DashboardSummarySchema } from "@app-platform/contracts";
import { z } from "zod";
import { request } from "@/lib/api-client";
import { dashboardKeys } from "@/hooks/query-keys";

export function useDashboardSummary(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => request("/v1/dashboard/summary", DashboardSummarySchema),
    staleTime: 60_000,
    enabled,
  });
}

export function useAuditLog(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => request(`/v1/audit-logs?limit=${limit}`, z.array(AuditLogSchema)),
    staleTime: 30_000,
    enabled,
  });
}
