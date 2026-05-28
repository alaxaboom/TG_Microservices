import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager';
import { NotificationEvent } from '../interfaces/notification-event.interface';
import { TelegramClientService } from './telegram-client.service';
import { ProcessedEventsRepository } from './processed-events.repository';

@Injectable()
export class ConsumerRunnerService implements OnModuleDestroy {
  private readonly logger = new Logger(ConsumerRunnerService.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;
  private readonly exchange: string;
  private readonly queue: string;
  private readonly routingKey: string;
  private readonly dlq: string;
  private readonly retryQueue5s: string;
  private readonly retryQueue30s: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramClientService: TelegramClientService,
    private readonly processedEventsRepository: ProcessedEventsRepository,
  ) {
    this.exchange = this.configService.get<string>('RABBITMQ_EXCHANGE', 'notifications.exchange');
    this.queue = this.configService.get<string>('RABBITMQ_QUEUE', 'telegram.queue');
    this.routingKey = this.configService.get<string>('RABBITMQ_ROUTING_KEY', 'notification.telegram');
    this.dlq = this.configService.get<string>('RABBITMQ_DLQ', 'telegram.dlq');
    this.retryQueue5s = this.configService.get<string>('RABBITMQ_RETRY_5S_QUEUE', 'telegram.retry.5s');
    this.retryQueue30s = this.configService.get<string>('RABBITMQ_RETRY_30S_QUEUE', 'telegram.retry.30s');
  }

  async start(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
    this.connection = connect([rabbitUrl]);
    this.channel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await this.setupTopology(channel);
        await channel.prefetch(1);
        await channel.consume(this.queue, (msg) => {
          void this.handleMessage(channel, msg);
        });
      },
    });
    this.logger.log('Consumer started');
  }

  private async setupTopology(channel: ConfirmChannel): Promise<void> {
    await channel.assertExchange(this.exchange, 'direct', { durable: true });

    await channel.assertQueue(this.queue, { durable: true });
    await channel.bindQueue(this.queue, this.exchange, this.routingKey);

    await channel.assertQueue(this.retryQueue5s, {
      durable: true,
      deadLetterExchange: this.exchange,
      deadLetterRoutingKey: this.routingKey,
      messageTtl: 5000,
    });
    await channel.assertQueue(this.retryQueue30s, {
      durable: true,
      deadLetterExchange: this.exchange,
      deadLetterRoutingKey: this.routingKey,
      messageTtl: 30000,
    });

    await channel.assertQueue(this.dlq, { durable: true });
  }

  private async handleMessage(channel: ConfirmChannel, message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    let event: NotificationEvent;
    try {
      event = JSON.parse(message.content.toString('utf-8')) as NotificationEvent;
    } catch {
      this.logger.error('Invalid JSON payload, message rejected');
      channel.nack(message, false, false);
      return;
    }

    if (!event.eventId || !event.payload?.chatId || !event.payload?.message) {
      this.logger.error('Invalid event payload, message rejected');
      channel.nack(message, false, false);
      return;
    }

    if (this.processedEventsRepository.isProcessed(event.eventId)) {
      this.logger.log(`Skip duplicated event: ${event.eventId}`);
      channel.ack(message);
      return;
    }

    const currentAttempt = this.getAttempt(message);
    try {
      await this.telegramClientService.send(event);
      this.processedEventsRepository.markProcessed(event.eventId);
      this.logger.log(`Event processed: ${event.eventId}`);
      channel.ack(message);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(`Processing failed, attempt=${currentAttempt}, event=${event.eventId}, error=${errMessage}`);
      await this.scheduleRetryOrDlq(channel, event, currentAttempt);
      channel.ack(message);
    }
  }

  private async scheduleRetryOrDlq(
    channel: ConfirmChannel,
    event: NotificationEvent,
    attempt: number,
  ): Promise<void> {
    const nextAttempt = attempt + 1;
    const body = Buffer.from(JSON.stringify(event), 'utf-8');

    if (attempt === 1) {
      channel.sendToQueue(this.retryQueue5s, body, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        headers: { 'x-attempt': nextAttempt },
      });
      return;
    }

    if (attempt === 2) {
      channel.sendToQueue(this.retryQueue30s, body, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        headers: { 'x-attempt': nextAttempt },
      });
      return;
    }

    channel.sendToQueue(this.dlq, body, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      headers: { 'x-attempt': nextAttempt },
    });
    this.logger.error(`Event moved to DLQ: ${event.eventId}`);
  }

  private getAttempt(message: ConsumeMessage): number {
    const headers = message.properties.headers as Record<string, unknown> | undefined;
    const raw = headers?.['x-attempt'];
    if (typeof raw === 'number' && raw > 0) {
      return raw;
    }
    return 1;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}
