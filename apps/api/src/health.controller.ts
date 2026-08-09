import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "./common/decorators/public.decorator";

@ApiExcludeController()
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok", checkedAt: new Date().toISOString() };
  }
}
