import { EnvSchema } from "./env.schema";

export function validateEnv(raw: Record<string, unknown>) {
  const result = EnvSchema.safeParse(raw);
  if (result.success) return result.data;

  // print every failing field in one shot — restarting once per field is a waste of time
  console.error("❌ Invalid environment configuration:\n");
  for (const issue of result.error.issues) {
    console.error(`  • ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  console.error("\nSee .env.example for the full list of required variables.\n");
  process.exit(1);
}
