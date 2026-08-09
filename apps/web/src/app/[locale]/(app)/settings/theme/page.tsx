"use client";

import { useTranslations } from "next-intl";

export default function ThemeSettingsPage() {
  const t = useTranslations("ComingSoon");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-foreground/70">{t("body")}</p>
    </main>
  );
}
