import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { TokenResponse } from "@app-platform/contracts";
import { UsersService } from "../users/users.service";
import { RefreshTokenService } from "./refresh-token.service";
import { Errors } from "../common/errors/app.exception";
import { getTraceId } from "../common/trace/trace-context";

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {}

  async login(email: string, password: string, meta: RequestMeta): Promise<TokenResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      this.logger.warn({ traceId: getTraceId(), email }, "login failed: unknown email");
      throw Errors.invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      this.logger.warn({ traceId: getTraceId(), userId: user.id }, "login failed: wrong password");
      throw Errors.invalidCredentials();
    }

    this.logger.info({ traceId: getTraceId(), userId: user.id }, "login succeeded");
    const familyId = this.refreshTokens.newFamilyId();
    const refreshToken = await this.refreshTokens.issue(user.id, familyId, meta);
    return this.signAccessToken(user.id, user.email, refreshToken);
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenResponse> {
    const { userId, refreshToken: rotated } = await this.refreshTokens.rotate(refreshToken, meta);
    const user = await this.usersService.findByIdOrThrow(userId);
    return this.signAccessToken(user.id, user.email, rotated);
  }

  private signAccessToken(userId: string, email: string, refreshToken: string): TokenResponse {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>(
        "JWT_ACCESS_EXPIRES_IN",
        "15m",
      ) as JwtSignOptions["expiresIn"],
    });
    const { exp, iat } = this.jwtService.decode<{ exp: number; iat: number }>(accessToken);

    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: exp - iat,
      refresh_token: refreshToken,
    };
  }
}
