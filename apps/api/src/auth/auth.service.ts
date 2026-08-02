import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { Login } from "@app-platform/contracts";
import { UsersService } from "../users/users.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: Login) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException("Invalid credentials");

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m"),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d"),
    });
    return { accessToken, refreshToken };
  }
}
