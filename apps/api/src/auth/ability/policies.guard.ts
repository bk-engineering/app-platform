import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Errors } from "../../common/errors/app.exception";
import { IS_PUBLIC } from "../../common/decorators/public.decorator";
import type { AuthenticatedRequest } from "../../common/types/authenticated-request";
import { AbilityFactory } from "./ability.factory";
import type { AppAbility } from "./ability.types";

export type PolicyHandler = (ability: AppAbility, req: AuthenticatedRequest) => boolean;

export const CHECK_POLICIES = "check_policies";
export const CheckPolicies = (...handlers: PolicyHandler[]) => SetMetadata(CHECK_POLICIES, handlers);

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
    @InjectPinoLogger(PoliciesGuard.name) private readonly logger: PinoLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const handlers = this.reflector.get<PolicyHandler[]>(CHECK_POLICIES, context.getHandler()) ?? [];
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // JwtAuthGuard runs first and always populates req.user on non-public routes
    const ability = await this.abilityFactory.forUser(req.user!.id);
    req.ability = ability;

    if (handlers.every((handler) => handler(ability, req))) return true;

    this.logger.warn({ userId: req.user?.id, path: req.path }, "permission denied");
    throw Errors.forbidden("perform this action on", "resource");
  }
}
