import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { status: 'ok'; service: 'telegram-service' } {
    return { status: 'ok', service: 'telegram-service' };
  }
}
