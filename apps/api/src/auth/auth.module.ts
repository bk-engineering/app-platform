import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RefreshTokenService } from "./refresh-token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AbilityFactory } from "./ability/ability.factory";
import { PoliciesGuard } from "./ability/policies.guard";

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    JwtAuthGuard,
    PoliciesGuard,
    AbilityFactory,
    // order matters: authenticate first, then attach/check the ability
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: PoliciesGuard },
  ],
  exports: [AbilityFactory],
})
export class AuthModule {}
