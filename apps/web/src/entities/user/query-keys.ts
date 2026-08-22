export const userKeys = {
  all: ["users"] as const,
  list: (filters: { page: number; search?: string }) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};
