import { createMongoAbility, type MongoAbility, type Subject } from "@casl/ability";
import type { AppAction, AppSubject, RawRule } from "@app-platform/contracts";

export type AppAbility = MongoAbility<[AppAction, AppSubject | Subject]>;

export function buildAbility(rules: RawRule[]): AppAbility {
  return createMongoAbility<AppAbility>(rules);
}
