import type { ConfigService } from '@nestjs/config';
import type { ConfirmChannel } from 'amqplib';
import type { NotificationEvent } from '../interfaces/notification-event.interface';
import { ConsumerRunnerService } from './consumer-runner.service';
import type { ProcessedEventsRepository } from './processed-events.repository';
import type { TelegramClientService } from './telegram-client.service';

const TEST_EVENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TEST_CHAT_ID = '100000001';

type RetryScheduler = {
  scheduleRetryOrDlq: (
    channel: ConfirmChannel,
    event: NotificationEvent,
    attempt: number,
  ) => Promise<void>;
};

describe('ConsumerRunnerService', () => {
  const configService = {
    get: jest.fn<string, [string, string]>((_key, defaultValue) => defaultValue),
  } as unknown as ConfigService;

  const telegramClientService = {
    send: jest.fn<Promise<void>, [NotificationEvent]>(),
  } as unknown as TelegramClientService;

  const processedEventsRepository = {
    isProcessed: jest.fn<boolean, [string]>(),
    markProcessed: jest.fn<void, [string]>(),
  } as unknown as ProcessedEventsRepository;

  const testEvent: NotificationEvent = {
    eventId: TEST_EVENT_ID,
    type: 'notification.telegram',
    payload: { chatId: TEST_CHAT_ID, message: 'Retry test' },
    createdAt: new Date().toISOString(),
  };

  it('routes first failed attempt to 5s retry queue', async () => {
    const service = new ConsumerRunnerService(
      configService,
      telegramClientService,
      processedEventsRepository,
    );
    const sendToQueueMock = jest.fn<boolean, [string, Buffer, Record<string, unknown>]>();
    const channel = { sendToQueue: sendToQueueMock } as unknown as ConfirmChannel;

    await (service as unknown as RetryScheduler).scheduleRetryOrDlq(channel, testEvent, 1);

    expect(sendToQueueMock).toHaveBeenCalledTimes(1);
    const [queueName, , options] = sendToQueueMock.mock.calls[0];
    expect(queueName).toBe('telegram.retry.5s');
    expect(options.headers).toEqual({ 'x-attempt': 2 });
  });
});
