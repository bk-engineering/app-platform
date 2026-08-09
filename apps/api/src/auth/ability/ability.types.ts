import type { MongoAbility, Subject } from "@casl/ability";
import type { AppAction, AppSubject } from "@app-platform/contracts";

// `Subject` (from @casl/ability) widens the second tuple slot to also accept objects
// tagged via subject('User', instance) for instance-level checks — AppSubject alone
// (a plain string union, shared with the client through ability.schema.ts) only
// covers type-level checks like ability.can('create', 'User').
export type AppAbility = MongoAbility<[AppAction, AppSubject | Subject]>;
