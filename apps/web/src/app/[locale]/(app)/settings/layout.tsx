"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, Separator } from "@/core/ui";
import { SettingsNav } from "@/features/settings";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("SettingsPage");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <Separator />
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-48 lg:shrink-0">
          <SettingsNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
