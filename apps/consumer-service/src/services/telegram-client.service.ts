import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { NotificationEvent } from '../interfaces/notification-event.interface';

@Injectable()
export class TelegramClientService {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('TELEGRAM_SERVICE_URL', 'http://telegram-service:3003');
    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async send(event: NotificationEvent): Promise<void> {
    await this.client.post('/send', {
      eventId: event.eventId,
      chatId: event.payload.chatId,
      message: event.payload.message,
      source: 'consumer-service',
    });
  }
}
