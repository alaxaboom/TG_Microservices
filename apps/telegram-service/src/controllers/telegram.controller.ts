import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendTelegramDto } from '../dto/send-telegram.dto';
import { ProcessedEventsRepository } from '../services/processed-events.repository';
import { TelegramApiService } from '../services/telegram-api.service';

@ApiTags('telegram')
@Controller()
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly processedEventsRepository: ProcessedEventsRepository,
    private readonly telegramApiService: TelegramApiService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send telegram notification' })
  async send(@Body() dto: SendTelegramDto): Promise<{ status: 'sent' | 'skipped'; eventId: string }> {
    if (await this.processedEventsRepository.isProcessed(dto.eventId)) {
      this.logger.log(`Skip duplicated send event: ${dto.eventId}`);
      return { status: 'skipped', eventId: dto.eventId };
    }

    await this.telegramApiService.sendMessage(dto.chatId, dto.message);
    await this.processedEventsRepository.markProcessed(dto.eventId);
    this.logger.log(`Telegram message sent for event: ${dto.eventId}`);
    return { status: 'sent', eventId: dto.eventId };
  }
}
