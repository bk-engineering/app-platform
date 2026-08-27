"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subject } from "@casl/ability";
import { UpdateUserSchema, type UpdateUser, type User } from "@app-platform/contracts";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/ui";
import { Field } from "@/core/ui";
import { Input } from "@/core/ui";
import { Button } from "@/core/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/ui";
import { useAbility } from "@/core/permissions";
import { useUpdateUser } from "@/entities/user";
import { useRoles } from "@/entities/role";
import { applyServerErrors } from "@/core/api-client";

export function EditUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const t = useTranslations("UsersPage");
  const ability = useAbility();
  const updateUser = useUpdateUser(user?.id ?? "");

  const target = user ? subject("User", user) : null;
  const canEditRoles = target ? ability.can("update", target, "roleIds") : false;
  const roles = useRoles(canEditRoles);

  const form = useForm<UpdateUser>({ resolver: zodResolver(UpdateUserSchema) });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName,
        email: user.email,
        status: user.status,
        roleIds: user.roles.map((r) => r.id),
      });
    }
  }, [user, form]);

  if (!user || !target) return null;

  const canEditDisplayName = ability.can("update", target, "displayName");
  const canEditEmail = ability.can("update", target, "email");
  const canEditStatus = ability.can("update", target, "status");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateUser.mutateAsync(values);
      toast.success(t("updateSuccess"));
      onClose();
    } catch (err) {
      applyServerErrors(form, err);
      if (!form.formState.errors.root) toast.error(t("updateError"));
    }
  });

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {canEditDisplayName && (
            <Field label={t("displayName")} error={form.formState.errors.displayName?.message}>
              <Input {...form.register("displayName")} />
            </Field>
          )}
          {canEditEmail && (
            <Field label={t("email")} error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
          )}
          {canEditStatus && (
            <Field label={t("status")}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                      <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
          {canEditRoles && roles.data && (
            <Field label={t("role")}>
              <Controller
                control={form.control}
                name="roleIds"
                render={({ field }) => (
                  <Select
                    value={field.value?.[0]}
                    onValueChange={(value) => field.onChange([value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.data.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
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
