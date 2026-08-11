import { useMutation } from "@tanstack/react-query";
import { ChangePasswordSchema, type ChangePassword } from "@app-platform/contracts";
import { z } from "zod";
import { request } from "@/lib/api-client";

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePassword) => {
      ChangePasswordSchema.parse(input);
      return request("/v1/auth/change-password", z.unknown(), { method: "POST", body: input });
    },
  });
}
