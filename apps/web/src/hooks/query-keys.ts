export const sessionKeys = { me: ["auth", "me"] as const };

export const userKeys = {
  all: ["users"] as const,
  list: (filters: { page: number; search?: string }) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
};

export const dashboardKeys = {
  summary: ["dashboard", "summary"] as const,
  activity: (limit: number) => ["dashboard", "activity", limit] as const,
};
