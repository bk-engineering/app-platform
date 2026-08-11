import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { IS_PUBLIC } from "../common/decorators/public.decorator";
import { Errors } from "../common/errors/app.exception";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  // lets the client tell "please refresh" (expired) apart from "please log in again"
  // (invalid/missing) instead of getting a generic 401 for both
  override handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
    if (err || !user) {
      if (info instanceof TokenExpiredError) throw Errors.tokenExpired();
      if (info instanceof JsonWebTokenError) throw Errors.tokenInvalid();
      throw Errors.tokenMissing();
    }
    return user;
  }
}
