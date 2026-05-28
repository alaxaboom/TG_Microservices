import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { status: 'ok'; service: 'consumer-service' } {
    return { status: 'ok', service: 'consumer-service' };
  }
}
