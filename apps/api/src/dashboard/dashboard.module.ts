import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { DashboardController } from "./dashboard.controller";

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
