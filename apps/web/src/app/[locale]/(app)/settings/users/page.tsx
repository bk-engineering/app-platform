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
import { EmptyState } from "@/core/ui";
import { PageHeader } from "@/core/ui";
import { DataTable, DataTableColumnHeader, DataTablePagination, type ColumnDef } from "@/core/ui";
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
  const [page, setPage] = useState(1);
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

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: "displayName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("displayName")} />,
      cell: ({ row }) => <span className="font-medium">{row.original.displayName}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("email")} />,
    },
    {
      id: "role",
      header: t("role"),
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role.id}>{role.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("status")} />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${row.original.status === "ACTIVE" ? "bg-success" : "bg-muted-foreground"}`}
          />
          {row.original.status === "ACTIVE" ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        const target = subject("User", user);
        const canUpdate = ability.can("update", target);
        const canDelete = ability.can("delete", target);
        if (!canUpdate && !canDelete) return null;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("actions")}>
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && <DropdownMenuItem onSelect={() => setEditing(user)}>{t("edit")}</DropdownMenuItem>}
                {canDelete && (
                  <DropdownMenuItem onSelect={() => setDeleting(user)} className="text-destructive">
                    {t("delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} actions={<CreateUserDialog />} />

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      {users.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="mb-2 text-destructive">{t("error")}</p>
          <Button size="sm" variant="outline" onClick={() => users.refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}

      {!users.isError && (
        <DataTable
          columns={columns}
          data={users.data?.items ?? []}
          isLoading={users.isLoading}
          emptyState={
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
          }
        />
      )}

      {users.data && users.data.total > users.data.limit && (
        <DataTablePagination
          page={page}
          onPageChange={setPage}
          hasNextPage={page * users.data.limit < users.data.total}
          label={(p) => `${p} / ${Math.ceil(users.data!.total / users.data!.limit)}`}
        />
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
