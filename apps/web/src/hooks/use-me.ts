import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateMeSchema, UserSchema, type UpdateMe } from "@app-platform/contracts";
import { request } from "@/lib/api-client";
import { sessionKeys } from "@/hooks/query-keys";

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMe) => {
      UpdateMeSchema.parse(input);
      return request("/v1/auth/me", UserSchema, { method: "PATCH", body: input });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.me }),
  });
}
