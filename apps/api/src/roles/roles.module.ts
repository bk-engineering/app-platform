import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { AuthModule } from "../auth/auth.module";
import { RolesController } from "./roles.controller";
import { RolesRepository } from "./roles.repository";
import { RolesService } from "./roles.service";

@Module({
  imports: [AuditLogModule, AuthModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
})
export class RolesModule {}
