import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-sm text-foreground/70">{t("subtitle")}</p>
      <Button>Get started</Button>
    </main>
  );
}
