import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { setUserId } from "../../common/trace/trace-context";
import { JWT_AUDIENCE, JWT_ISSUER } from "../jwt.constants";

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  validate(payload: JwtPayload) {
    setUserId(payload.sub);
    return { id: payload.sub, email: payload.email };
  }
}
