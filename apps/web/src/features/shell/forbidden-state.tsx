import { useTranslations } from "next-intl";
import { Link } from "@/core/i18n";
import { buttonVariants } from "@/core/ui";

export function ForbiddenState() {
  const t = useTranslations("ForbiddenState");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-sm text-foreground/70">{t("description")}</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        {t("backToHome")}
      </Link>
    </main>
  );
}
