import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ProcessedEventsRepository } from '../src/services/processed-events.repository';
import { TelegramApiService } from '../src/services/telegram-api.service';

const TEST_EVENT_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('TelegramService (e2e)', () => {
  let app: INestApplication<App>;
  const sendMessageMock = jest.fn<Promise<void>, [string, string]>();

  beforeEach(async () => {
    sendMessageMock.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProcessedEventsRepository)
      .useValue({
        onModuleInit: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
        isProcessed: jest.fn<Promise<boolean>, [string]>().mockResolvedValue(false),
        markProcessed: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
      })
      .overrideProvider(TelegramApiService)
      .useValue({ sendMessage: sendMessageMock })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /send delivers telegram notification', async () => {
    const response = await request(app.getHttpServer())
      .post('/send')
      .send({
        eventId: TEST_EVENT_ID,
        chatId: '123456789',
        message: 'e2e telegram',
        source: 'consumer-service',
      })
      .expect(200);

    expect(response.body).toEqual({ status: 'sent', eventId: TEST_EVENT_ID });
    expect(sendMessageMock).toHaveBeenCalledWith('123456789', 'e2e telegram');
  });
});
