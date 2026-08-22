import type { AppAbility } from "./ability";
import type { AppAction, AppSubject } from "@app-platform/contracts";

/** unconditional (no per-row `conditions`) access — distinguishes "sees the org" from "sees only self" */
export function canUnconditionally(ability: AppAbility, action: AppAction, subject: AppSubject): boolean {
  return ability.rulesFor(action, subject).some((rule) => !rule.conditions && !rule.inverted);
}
