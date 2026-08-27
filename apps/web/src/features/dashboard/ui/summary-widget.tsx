"use client";

import { useTranslations } from "next-intl";
import { useAbility, canUnconditionally } from "@/core/permissions";
import { Skeleton, Button, Card, CardContent, CardHeader, CardTitle } from "@/core/ui";
import { useDashboardSummary } from "../use-dashboard";

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === undefined ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  );
}

export function SummaryWidget() {
  const t = useTranslations("DashboardPage");
  const ability = useAbility();
  const canSeeSummary = canUnconditionally(ability, "read", "User");
  const summary = useDashboardSummary(canSeeSummary);

  if (!canSeeSummary) return null;

  if (summary.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="mb-2 text-destructive">{t("summaryError")}</p>
        <Button size="sm" variant="outline" onClick={() => summary.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label={t("totalUsers")} value={summary.data?.totalUsers} />
      <StatCard label={t("activeUsers")} value={summary.data?.activeUsers} />
      <StatCard label={t("inactiveUsers")} value={summary.data?.inactiveUsers} />
    </div>
  );
}
