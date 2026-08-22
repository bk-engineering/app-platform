"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { subject } from "@casl/ability";
import { toast } from "sonner";
import { MoreVertical, Search } from "lucide-react";
import type { User } from "@app-platform/contracts";
import { useAbility } from "@/core/permissions";
import { canUnconditionally } from "@/core/permissions";
import { useSession } from "@/core/auth";
import { useUsers, useDeleteUser } from "@/entities/user";
import { ForbiddenState } from "@/features/shell";
import { Input } from "@/core/ui";
import { Button } from "@/core/ui";
import { Badge } from "@/core/ui";
import { Skeleton } from "@/core/ui";
import { EmptyState } from "@/core/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/ui";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/ui";
import { CreateUserDialog } from "@/features/users";
import { EditUserDialog } from "@/features/users";
import { ApiError } from "@/core/api-client";
import { getMe } from "@/core/auth";
import { sessionKeys } from "@/core/auth";

export default function UsersSettingsPage() {
  const t = useTranslations("UsersPage");
  const ability = useAbility();
  const session = useSession();
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  // dedupes with AbilityProvider's own fetch — this just lets us read isPending
  const me = useQuery({ queryKey: sessionKeys.me, queryFn: getMe, enabled: session !== null });
  const canReadAll = canUnconditionally(ability, "read", "User");
  const users = useUsers(page, search);
  const deleteUser = useDeleteUser();

  if (session === null) return null;
  if (me.isPending) return null;
  if (!canReadAll) return <ForbiddenState />;

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success(t("deleteSuccess"));
      setDeleting(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "USER_LAST_ADMIN") {
        toast.error(t("lastAdminError"));
      } else {
        toast.error(t("deleteError"));
      }
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <CreateUserDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {users.isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {users.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="mb-2 text-destructive">{t("error")}</p>
          <Button size="sm" variant="outline" onClick={() => users.refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}

      {users.data && users.data.items.length === 0 && (
        <EmptyState
          title={search ? t("noSearchResults", { search }) : t("noUsers")}
          action={
            search ? (
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                {t("clearFilters")}
              </Button>
            ) : undefined
          }
        />
      )}

      {users.data && users.data.items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("displayName")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.items.map((user) => {
              const target = subject("User", user);
              const canUpdate = ability.can("update", target);
              const canDelete = ability.can("delete", target);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id}>{role.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${user.status === "ACTIVE" ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      {user.status === "ACTIVE" ? t("active") : t("inactive")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t("actions")}>
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem onSelect={() => setEditing(user)}>{t("edit")}</DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem onSelect={() => setDeleting(user)} className="text-destructive">
                              {t("delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <EditUserDialog user={editing} onClose={() => setEditing(null)} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteTitle", { name: deleting?.displayName ?? "" })}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
