"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUpdateMe } from "@/hooks/use-me";

const MODES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export default function ThemeSettingsPage() {
  const t = useTranslations("ThemePage");
  const { theme, setTheme } = useTheme();
  const updateMe = useUpdateMe();

  const handleSelect = (value: "light" | "dark" | "system") => {
    setTheme(value);
    updateMe.mutate(
      { theme: value },
      {
        onError: () => {
          // optimistic UI already applied — retry silently in the background
          setTimeout(() => updateMe.mutate({ theme: value }), 3000);
        },
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("colorMode")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                  theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                )}
              >
                <Icon className="size-5" />
                {t(value)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("preview")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button>{t("previewButton")}</Button>
          <p className="text-sm text-muted-foreground">{t("previewText")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
