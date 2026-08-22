export const dashboardKeys = {
  summary: ["dashboard", "summary"] as const,
  activity: (limit: number) => ["dashboard", "activity", limit] as const,
};
