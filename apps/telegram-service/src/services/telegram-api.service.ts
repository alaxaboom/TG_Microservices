import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TelegramApiService {
  private readonly client: AxiosInstance;
  private readonly botToken: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.client = axios.create({
      baseURL: 'https://api.telegram.org',
      timeout: 5000,
    });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    await this.client.post(`/bot${this.botToken}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  }
}
