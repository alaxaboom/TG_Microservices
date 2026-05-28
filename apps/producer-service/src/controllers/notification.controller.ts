import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotifyDto } from '../dto/notify.dto';
import { RabbitPublisherService } from '../infrastructure/rabbit-publisher.service';

@ApiTags('notifications')
@Controller('notify')
export class NotificationController {
  constructor(private readonly publisherService: RabbitPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Publish notification event' })
  async publish(@Body() dto: NotifyDto): Promise<{ eventId: string; status: 'queued' }> {
    const eventId = await this.publisherService.publish(dto.chatId, dto.message);
    return { eventId, status: 'queued' };
  }
}
