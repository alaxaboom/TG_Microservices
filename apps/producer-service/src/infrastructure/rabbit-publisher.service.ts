import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  AmqpConnectionManager,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager';

type NotificationEvent = {
  eventId: string;
  type: 'notification.telegram';
  payload: {
    chatId: string;
    message: string;
  };
  createdAt: string;
};

@Injectable()
export class RabbitPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitPublisherService.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;

  constructor(private readonly configService: ConfigService) {}

  async publish(chatId: string, message: string): Promise<string> {
    const eventId = randomUUID();
    const event: NotificationEvent = {
      eventId,
      type: 'notification.telegram',
      payload: { chatId, message },
      createdAt: new Date().toISOString(),
    };
    await this.publishWithRetry(event);
    return eventId;
  }

  private async publishWithRetry(event: NotificationEvent): Promise<void> {
    const maxAttempts = 3;
    let currentAttempt = 0;

    while (currentAttempt < maxAttempts) {
      currentAttempt += 1;
      try {
        await this.ensureChannel();
        const channel = this.channel;
        if (!channel) {
          throw new Error('RabbitMQ channel not initialized');
        }

        const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE', 'notifications.exchange');
        const routingKey = this.configService.get<string>('RABBITMQ_ROUTING_KEY', 'notification.telegram');
        const body = Buffer.from(JSON.stringify(event), 'utf-8');

        await channel.publish(exchange, routingKey, body, {
          contentType: 'application/json',
          persistent: true,
          messageId: event.eventId,
          headers: { 'x-attempt': 1 },
        });

        this.logger.log(`Event published: ${event.eventId}`);
        return;
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Unknown publish error';
        this.logger.error(`Publish attempt ${currentAttempt} failed: ${errMessage}`);
        await this.resetConnection();
        if (currentAttempt >= maxAttempts) {
          throw error;
        }
        await this.sleep(1000 * currentAttempt);
      }
    }
  }

  private async ensureChannel(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    const uri = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    this.connection = connect([uri]);
    this.channel = this.connection.createChannel({
      setup: async (channel) => {
        const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE', 'notifications.exchange');
        await channel.assertExchange(exchange, 'direct', { durable: true });
      },
    });
  }

  private async resetConnection(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.resetConnection();
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
