"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema, type CreateUser } from "@app-platform/contracts";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/ui";
import { Field } from "@/core/ui";
import { Input } from "@/core/ui";
import { Button } from "@/core/ui";
import { useCreateUser } from "@/entities/user";
import { applyServerErrors } from "@/core/api-client";
import { useState } from "react";

export function CreateUserDialog() {
  const t = useTranslations("UsersPage");
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const form = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { email: "", displayName: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createUser.mutateAsync(values);
      toast.success(t("createSuccess"));
      form.reset();
      setOpen(false);
    } catch (err) {
      applyServerErrors(form, err);
      if (!form.formState.errors.root) toast.error(t("createError"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("addUser")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label={t("displayName")} error={form.formState.errors.displayName?.message}>
            <Input {...form.register("displayName")} />
          </Field>
          <Field label={t("email")} error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label={t("password")} error={form.formState.errors.password?.message}>
            <Input type="password" {...form.register("password")} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
