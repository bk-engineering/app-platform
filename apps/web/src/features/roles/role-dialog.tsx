"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Role } from "@app-platform/contracts";
import { UpdateRoleSchema, CreateRoleSchema, type UpdateRole, type CreateRole } from "@app-platform/contracts";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/ui";
import { Field } from "@/core/ui";
import { Input } from "@/core/ui";
import { Button } from "@/core/ui";
import { Checkbox } from "@/core/ui";
import { Label } from "@/core/ui";
import { usePermissions, useCreateRole, useUpdateRole } from "@/entities/role";
import { applyServerErrors } from "@/core/api-client";
import { ApiError } from "@/core/api-client";

export function RoleDialog({
  role,
  canEdit,
  onClose,
}: {
  role: Role | "new" | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("RolesPage");
  const open = role !== null;
  const isNew = role === "new";
  const permissions = usePermissions(open);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(isNew || !role ? "" : role.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const form = useForm<CreateRole | UpdateRole>({
    resolver: zodResolver(isNew ? CreateRoleSchema : UpdateRoleSchema),
  });

  useEffect(() => {
    if (isNew) {
      form.reset({ key: "", name: "", permissionIds: [] });
      setSelected(new Set());
    } else if (role) {
      form.reset({ name: role.name, permissionIds: role.permissionIds });
      setSelected(new Set(role.permissionIds));
    }
  }, [role, isNew, form]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof permissions.data>();
    for (const p of permissions.data ?? []) {
      const list = map.get(p.subject) ?? [];
      list.push(p);
      map.set(p.subject, list as never);
    }
    return map;
  }, [permissions.data]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      form.setValue("permissionIds", Array.from(next));
      return next;
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isNew) {
        await createRole.mutateAsync(values as CreateRole);
        toast.success(t("createSuccess"));
      } else {
        await updateRole.mutateAsync(values as UpdateRole);
        toast.success(t("updateSuccess"));
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESOURCE_CONFLICT") {
        form.setError("key" as never, { message: t("keyTaken"), type: "server" });
        return;
      }
      applyServerErrors(form, err);
      if (!form.formState.errors.root) toast.error(t("saveError"));
    }
  });

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? t("addRole") : t("editRole", { name: role.name })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <fieldset disabled={!canEdit} className="flex flex-col gap-4">
            <Field label={t("name")} error={(form.formState.errors as { name?: { message?: string } }).name?.message}>
              <Input {...form.register("name")} />
            </Field>

            {isNew && (
              <Field
                label={t("key")}
                hint={t("keyHint")}
                error={(form.formState.errors as { key?: { message?: string } }).key?.message}
              >
                <Input {...form.register("key" as never)} />
              </Field>
            )}

            <div className="flex flex-col gap-3">
              <Label>{t("permissions")}</Label>
              {Array.from(grouped.entries()).map(([subjectName, perms]) => (
                <div key={subjectName} className="rounded-md border border-border p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{subjectName}</p>
                  <div className="flex flex-wrap gap-4">
                    {perms?.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Controller
                          control={form.control}
                          name="permissionIds"
                          render={() => (
                            <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                          )}
                        />
                        {p.action}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {canEdit && (
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("save")}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
