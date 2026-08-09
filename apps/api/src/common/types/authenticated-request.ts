import type { Request } from "express";
import type { AppAbility } from "../../auth/ability/ability.types";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Explicit intersection type instead of ambient `declare global { namespace Express }`
 * augmentation — ts-node-dev only type-checks files reachable from the entrypoint's
 * import graph, so a local project file with no runtime imports (a pure ambient .d.ts)
 * is silently invisible to it even though plain `tsc` picks it up fine.
 */
export type AuthenticatedRequest = Request & {
  user?: AuthUser;
  ability: AppAbility;
};
