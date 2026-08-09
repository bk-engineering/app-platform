import "dotenv/config";
import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ZodValidationPipe());

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const appWebUrl = config.get("APP_WEB_URL", { infer: true });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", appWebUrl],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );

  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["content-type", "authorization", "x-request-id"],
  });

  // business API routes only — /health and Swagger stay unversioned
  app.setGlobalPrefix("v1", { exclude: ["health", "health/*path"] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("app-platform API")
    .setDescription("API for the app-platform monorepo")
    .setVersion("0.1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token",
    )
    .addOAuth2(
      {
        type: "oauth2",
        flows: {
          password: {
            tokenUrl: "/v1/auth/token",
            refreshUrl: "/v1/auth/token",
            scopes: {},
          },
        },
      },
      "oauth2",
    )
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig));
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get("API_PORT", { infer: true });
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
