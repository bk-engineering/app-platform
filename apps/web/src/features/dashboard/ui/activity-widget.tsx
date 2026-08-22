"use client";

import { useTranslations } from "next-intl";
import { ScrollText, RefreshCw } from "lucide-react";
import { useAbility } from "@/core/permissions";
import { Skeleton, EmptyState, Button, Card, CardContent, CardHeader, CardTitle } from "@/core/ui";
import { useAuditLog } from "../use-dashboard";

export function ActivityWidget() {
  const t = useTranslations("DashboardPage");
  const ability = useAbility();
  const canSeeActivity = ability.can("read", "AuditLog");
  const activity = useAuditLog(10, canSeeActivity);

  if (!canSeeActivity) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{t("recentActivity")}</CardTitle>
        <Button size="icon" variant="ghost" aria-label={t("retry")} onClick={() => activity.refetch()}>
          <RefreshCw className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
