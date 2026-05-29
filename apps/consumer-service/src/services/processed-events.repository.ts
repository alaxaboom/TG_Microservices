import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const KEY_PREFIX = 'processed-events:notification:';

@Injectable()
export class ProcessedEventsRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessedEventsRepository.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    await this.client.ping();
    this.logger.log('Redis connected for idempotency store');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async isProcessed(eventId: string): Promise<boolean> {
    const exists = await this.getClient().exists(`${KEY_PREFIX}${eventId}`);
    return exists === 1;
  }

  async markProcessed(eventId: string): Promise<void> {
    const ttlSeconds = Number(
      this.configService.get<string>('PROCESSED_EVENTS_TTL_SECONDS', '604800'),
    );
    await this.getClient().set(`${KEY_PREFIX}${eventId}`, '1', 'EX', ttlSeconds);
  }

  private getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client;
  }
}
