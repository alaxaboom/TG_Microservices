import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ConsumerRunnerService } from '../src/services/consumer-runner.service';
import { ProcessedEventsRepository } from '../src/services/processed-events.repository';

describe('ConsumerService (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConsumerRunnerService)
      .useValue({ start: jest.fn<Promise<void>, []>().mockResolvedValue(undefined) })
      .overrideProvider(ProcessedEventsRepository)
      .useValue({
        onModuleInit: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
        isProcessed: jest.fn<Promise<boolean>, [string]>().mockResolvedValue(false),
        markProcessed: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', service: 'consumer-service' });
  });
});
