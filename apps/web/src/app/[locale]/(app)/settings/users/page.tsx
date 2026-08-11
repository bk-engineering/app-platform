"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { paginatedSchema, UserSchema } from "@app-platform/contracts";
import { request } from "@/lib/api-client";
import { useAbility } from "@/lib/ability-context";
import { ForbiddenState } from "@/components/forbidden-state";
import { getMe } from "@/lib/auth";
import { useSession } from "@/hooks/use-session";

const UserPageSchema = paginatedSchema(UserSchema);

export default function UsersSettingsPage() {
  const t = useTranslations("UsersPage");
  const ability = useAbility();
  const session = useSession();

  // same query the AbilityProvider runs — react-query dedupes it, this just reads isPending
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: getMe, enabled: session !== null });

  const users = useQuery({
    queryKey: ["users", { page: 1 }],
    queryFn: () => request("/v1/users?page=1&limit=20", UserPageSchema),
    // wait for rules to load so we don't fire a request the guard will 403 on
    enabled: !me.isPending && ability.can("read", "User"),
  });

  if (me.isPending) return null;
  if (ability.cannot("read", "User")) return <ForbiddenState />;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {users.isLoading && <p className="text-sm text-foreground/70">{t("loading")}</p>}
      {users.isError && <p className="text-sm text-red-600">{t("error")}</p>}

      {users.data && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 font-medium">{t("displayName")}</th>
              <th className="py-2 font-medium">{t("email")}</th>
              <th className="py-2 font-medium">{t("createdAt")}</th>
            </tr>
          </thead>
          <tbody>
            {users.data.items.map((user) => (
              <tr key={user.id} className="border-b border-black/5">
                <td className="py-2">{user.displayName}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
