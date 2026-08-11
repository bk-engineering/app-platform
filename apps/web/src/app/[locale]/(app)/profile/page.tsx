"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { getMe } from "@/lib/auth";
import { sessionKeys } from "@/hooks/query-keys";
import { useSession } from "@/hooks/use-session";
import { useUpdateMe } from "@/hooks/use-me";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordDialog } from "@/components/forms/change-password-dialog";

interface ProfileForm {
  displayName: string;
}

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const session = useSession();
  const me = useQuery({ queryKey: sessionKeys.me, queryFn: getMe, enabled: session !== null });
  const updateMe = useUpdateMe();

  const form = useForm<ProfileForm>({ defaultValues: { displayName: "" } });

  useEffect(() => {
    if (me.data) form.reset({ displayName: me.data.user.displayName });
  }, [me.data, form]);

  if (session === null) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMe.mutateAsync(values);
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    }
  });

  if (me.isLoading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label={t("displayName")} error={form.formState.errors.displayName?.message}>
          <Input {...form.register("displayName", { required: true, maxLength: 120 })} />
        </Field>

        <Field label={t("email")}>
          <div className="flex items-center gap-2">
            <Input value={me.data?.user.email ?? ""} disabled className="flex-1" />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" />
              {t("verified")}
            </span>
          </div>
        </Field>

        <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
          {t("save")}
        </Button>
      </form>

      <div className="border-t border-border pt-6">
        <p className="mb-3 text-sm font-semibold">{t("security")}</p>
        <ChangePasswordDialog />
      </div>
    </div>
  );
}
