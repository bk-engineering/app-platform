import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module.js";

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("app-platform API")
    .setDescription("API for the app-platform monorepo")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
