"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import type { Role } from "@app-platform/contracts";
import { useAbility } from "@/core/permissions";
import { useSession } from "@/core/auth";
import { useRoles, useDeleteRole } from "@/entities/role";
import { ForbiddenState } from "@/features/shell";
import { Button } from "@/core/ui";
import { Skeleton } from "@/core/ui";
import { PageHeader } from "@/core/ui";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/ui";
import { RoleDialog } from "@/features/roles";
import { ApiError } from "@/core/api-client";
import { getMe } from "@/core/auth";
import { sessionKeys } from "@/core/auth";

export default function RolesSettingsPage() {
  const t = useTranslations("RolesPage");
  const ability = useAbility();
  const session = useSession();
  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  // dedupes with AbilityProvider's own fetch — this just lets us read isPending
  const me = useQuery({ queryKey: sessionKeys.me, queryFn: getMe, enabled: session !== null });
  const canRead = ability.can("read", "Role");
  const canCreate = ability.can("create", "Role");
  const canUpdate = ability.can("update", "Role");
  const roles = useRoles(canRead);
  const deleteRole = useDeleteRole();

  if (session === null) return null;
  if (me.isPending) return null;
  if (!canRead) return <ForbiddenState />;

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRole.mutateAsync(deleting.id);
      toast.success(t("deleteSuccess"));
      setDeleting(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ROLE_IN_USE") {
        toast.error(t("roleInUse", { count: deleting.userCount }));
      } else {
        toast.error(t("deleteError"));
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        actions={canCreate && <Button onClick={() => setEditing("new")}>{t("addRole")}</Button>}
      />

      {roles.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {roles.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {roles.data.map((role) => (
            <button
              key={role.id}
              onClick={() => setEditing(role)}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{role.name}</span>
                {role.isSystem && <Lock className="size-3.5 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">{t("permissionCount", { count: role.permissionIds.length })}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t("userCount", { count: role.userCount })}</p>
                {!role.isSystem && role.userCount === 0 && canUpdate && (
                  <span
                    role="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(role);
                    }}
                  >
                    {t("delete")}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <RoleDialog role={editing} canEdit={editing === "new" ? canCreate : canUpdate} onClose={() => setEditing(null)} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteTitle", { name: deleting?.name ?? "" })}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRole.isPending}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
