"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PasswordSchema } from "@app-platform/contracts";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/hooks/use-change-password";
import { ApiError } from "@/lib/api-client";

const ChangePasswordFormSchema = z
  .object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "mismatch",
    path: ["confirmPassword"],
  });
type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;

export function ChangePasswordDialog() {
  const t = useTranslations("ProfilePage");
  const [open, setOpen] = useState(false);
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordForm>({ resolver: zodResolver(ChangePasswordFormSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync(values);
      toast.success(t("passwordChanged"));
      form.reset();
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "AUTH_INVALID_CURRENT_PASSWORD") {
        form.setError("currentPassword", { message: t("wrongCurrentPassword") });
      } else {
        toast.error(t("passwordChangeError"));
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("changePassword")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changePassword")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label={t("currentPassword")} error={form.formState.errors.currentPassword?.message}>
            <Input type="password" {...form.register("currentPassword")} />
          </Field>
          <Field label={t("newPassword")} error={form.formState.errors.newPassword?.message}>
            <Input type="password" {...form.register("newPassword")} />
          </Field>
          <Field
            label={t("confirmPassword")}
            error={form.formState.errors.confirmPassword ? t("passwordMismatch") : undefined}
          >
            <Input type="password" {...form.register("confirmPassword")} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("changePassword")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
