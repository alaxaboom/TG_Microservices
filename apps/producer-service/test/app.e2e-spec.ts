import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { RabbitPublisherService } from '../src/infrastructure/rabbit-publisher.service';

describe('ProducerService (e2e)', () => {
  let app: INestApplication<App>;
  const publishMock = jest.fn<Promise<string>, [string, string]>();

  beforeEach(async () => {
    publishMock.mockResolvedValue('e2e-event-id');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitPublisherService)
      .useValue({ publish: publishMock })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /notify returns queued event id', async () => {
    const response = await request(app.getHttpServer())
      .post('/notify')
      .send({ chatId: '123456789', message: 'e2e test' })
      .expect(202);

    expect(response.body).toEqual({ eventId: 'e2e-event-id', status: 'queued' });
    expect(publishMock).toHaveBeenCalledWith('123456789', 'e2e test');
  });
});
