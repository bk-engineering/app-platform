"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Users as UsersIcon } from "lucide-react";
import { useAbility, canUnconditionally } from "@/core/permissions";
import { useSession, getMe, sessionKeys } from "@/core/auth";
import { SummaryWidget, ActivityWidget } from "@/features/dashboard";
import { EmptyState, PageHeader } from "@/core/ui";

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
      <PageHeader title={t("greeting", { name: me.data?.user.displayName ?? "" })} />

      {!hasAnyWidget && (
        <EmptyState icon={<UsersIcon />} title={t("nothingToShow")} description={t("nothingToShowDescription")} />
      )}

      <SummaryWidget />
      <ActivityWidget />
    </div>
  );
}
