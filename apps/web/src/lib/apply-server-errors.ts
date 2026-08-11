import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { ApiError } from "@/lib/api-client";

/** maps a 422 validation error envelope back onto react-hook-form fields; rethrows anything else */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, err: unknown) {
  if (!(err instanceof ApiError) || err.status !== 422) throw err;

  if (!err.details?.length) {
    form.setError("root", { message: err.code, type: "server" });
    return;
  }

  for (const detail of err.details) {
    if (detail.field) {
      form.setError(detail.field as Path<T>, { message: detail.code, type: "server" });
    } else {
      form.setError("root", { message: detail.code, type: "server" });
    }
  }
}
