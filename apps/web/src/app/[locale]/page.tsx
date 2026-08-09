"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/hooks/use-session";
import { getMe, logout } from "@/lib/auth";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const session = useSession();

  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: session !== null,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-sm text-foreground/70">{t("subtitle")}</p>

      {session ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">{t("loggedInAs", { email: me.data?.user.email ?? "…" })}</p>
          <Button variant="outline" onClick={() => logout()}>
            {t("logOut")}
          </Button>
        </div>
      ) : (
        <Link href="/login" className={buttonVariants()}>
          {t("logIn")}
        </Link>
      )}
    </main>
  );
}
