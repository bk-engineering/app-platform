"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Users as UsersIcon, RefreshCw } from "lucide-react";
import { useAbility } from "@/lib/ability-context";
import { canUnconditionally } from "@/lib/ability-helpers";
import { useSession } from "@/hooks/use-session";
import { getMe } from "@/lib/auth";
import { sessionKeys } from "@/hooks/query-keys";
import { useAuditLog, useDashboardSummary } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      )}
    </div>
  );
}

function SummaryWidget() {
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

function ActivityWidget() {
  const t = useTranslations("DashboardPage");
  const ability = useAbility();
  const canSeeActivity = ability.can("read", "AuditLog");
  const activity = useAuditLog(10, canSeeActivity);

  if (!canSeeActivity) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("recentActivity")}</h2>
        <Button size="icon" variant="ghost" aria-label={t("retry")} onClick={() => activity.refetch()}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {activity.isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}

      {activity.isError && (
        <div className="text-sm">
          <p className="mb-2 text-destructive">{t("activityError")}</p>
          <Button size="sm" variant="outline" onClick={() => activity.refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}

      {activity.data && activity.data.length === 0 && (
        <EmptyState icon={<ScrollText />} title={t("noActivity")} />
      )}

      {activity.data && activity.data.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {activity.data.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
              <span>
                <strong className="font-medium">{entry.actorName ?? t("system")}</strong>{" "}
                {entry.action} {entry.subjectType}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("DashboardPage");
  const session = useSession();
  const ability = useAbility();
  const me = useQuery({ queryKey: sessionKeys.me, queryFn: getMe, enabled: session !== null });

  const canSeeSummary = canUnconditionally(ability, "read", "User");
  const canSeeActivity = ability.can("read", "AuditLog");
  const hasAnyWidget = canSeeSummary || canSeeActivity;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {t("greeting", { name: me.data?.user.displayName ?? "" })}
      </h1>

      {!hasAnyWidget && (
        <EmptyState icon={<UsersIcon />} title={t("nothingToShow")} description={t("nothingToShowDescription")} />
      )}

      <SummaryWidget />
      <ActivityWidget />
    </div>
  );
}
