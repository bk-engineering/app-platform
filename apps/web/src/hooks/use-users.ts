import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CreateUserSchema, UpdateUserSchema, paginatedSchema, UserSchema, type CreateUser, type UpdateUser } from "@app-platform/contracts";
import { request } from "@/lib/api-client";
import { userKeys, sessionKeys } from "@/hooks/query-keys";

const UsersPageSchema = paginatedSchema(UserSchema);

export function useUsers(page: number, search: string) {
  return useQuery({
    queryKey: userKeys.list({ page, search: search || undefined }),
    queryFn: () =>
      request(
        `/v1/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        UsersPageSchema,
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUser) => {
      CreateUserSchema.parse(input);
      return request("/v1/users", UserSchema, { method: "POST", body: input });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUser) => {
      UpdateUserSchema.parse(input);
      return request(`/v1/users/${id}`, UserSchema, { method: "PATCH", body: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: sessionKeys.me });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/v1/users/${id}`, z.unknown(), { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
