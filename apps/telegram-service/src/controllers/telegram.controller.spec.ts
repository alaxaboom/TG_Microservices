import { TelegramController } from './telegram.controller';
import type { SendTelegramDto } from '../dto/send-telegram.dto';
import type { ProcessedEventsRepository } from '../services/processed-events.repository';
import type { TelegramApiService } from '../services/telegram-api.service';

const TEST_EVENT_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const TEST_CHAT_ID = '100000002';

describe('TelegramController', () => {
  const isProcessedMock = jest.fn<boolean, [string]>();
  const markProcessedMock = jest.fn<void, [string]>();
  const sendMessageMock = jest.fn<Promise<void>, [string, string]>();

  const processedEventsRepository = {
    isProcessed: isProcessedMock,
    markProcessed: markProcessedMock,
  } as unknown as ProcessedEventsRepository;

  const telegramApiService = {
    sendMessage: sendMessageMock,
  } as unknown as TelegramApiService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips duplicate event without calling Telegram API', async () => {
    isProcessedMock.mockReturnValue(true);
    const controller = new TelegramController(
      processedEventsRepository,
      telegramApiService,
    );
    const dto: SendTelegramDto = {
      eventId: TEST_EVENT_ID,
      chatId: TEST_CHAT_ID,
      message: 'Idempotency test',
      source: 'consumer-service',
    };

    const result = await controller.send(dto);

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(markProcessedMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'skipped', eventId: TEST_EVENT_ID });
  });
});
