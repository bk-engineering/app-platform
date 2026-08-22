import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateRoleSchema,
  PermissionSchema,
  RoleSchema,
  UpdateRoleSchema,
  type CreateRole,
  type UpdateRole,
} from "@app-platform/contracts";
import { z } from "zod";
import { request } from "@/core/api-client";
import { roleKeys } from "./query-keys";
import { sessionKeys } from "@/core/auth";

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => request("/v1/roles", z.array(RoleSchema)),
    enabled,
  });
}

export function usePermissions(enabled = true) {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => request("/v1/roles/permissions", z.array(PermissionSchema)),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRole) => {
      CreateRoleSchema.parse(input);
      return request("/v1/roles", RoleSchema, { method: "POST", body: input });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRole) => {
      UpdateRoleSchema.parse(input);
      return request(`/v1/roles/${id}`, RoleSchema, { method: "PATCH", body: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: sessionKeys.me });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/v1/roles/${id}`, z.unknown(), { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
