import type { ConfigService } from '@nestjs/config';
import { connect } from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { RabbitPublisherService } from './rabbit-publisher.service';

jest.mock('amqp-connection-manager', () => ({
  connect: jest.fn(),
}));

const TEST_CHAT_ID = '100000001';
const TEST_MESSAGE = 'Test notification';

describe('RabbitPublisherService', () => {
  const publishMock = jest.fn<Promise<boolean>, [string, string, Buffer, Record<string, unknown>]>();
  const createChannelMock = jest.fn<ChannelWrapper, [unknown]>();

  const channelWrapper = {
    publish: publishMock,
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as ChannelWrapper;

  const connection = {
    createChannel: createChannelMock,
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as AmqpConnectionManager;

  const getMock = jest.fn<string, [string, string]>();
  const configService = { get: getMock } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    createChannelMock.mockReturnValue(channelWrapper);
    publishMock.mockResolvedValue(true);
    (connect as jest.MockedFunction<typeof connect>).mockReturnValue(connection);
    getMock.mockImplementation((key: string, defaultValue: string) => {
      if (key === 'RABBITMQ_URL') return 'amqp://guest:guest@rabbitmq:5672';
      if (key === 'RABBITMQ_EXCHANGE') return 'notifications.exchange';
      if (key === 'RABBITMQ_ROUTING_KEY') return 'notification.telegram';
      return defaultValue;
    });
  });

  it('publishes event with routing key, messageId and broker confirm', async () => {
    const service = new RabbitPublisherService(configService);

    const eventId = await service.publish(TEST_CHAT_ID, TEST_MESSAGE);

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, body, options] = publishMock.mock.calls[0];
    const payload = JSON.parse(body.toString('utf-8')) as {
      eventId: string;
      payload: { chatId: string; message: string };
    };

    expect(exchange).toBe('notifications.exchange');
    expect(routingKey).toBe('notification.telegram');
    expect(payload.eventId).toBe(eventId);
    expect(payload.payload.chatId).toBe(TEST_CHAT_ID);
    expect(payload.payload.message).toBe(TEST_MESSAGE);
    expect(options.messageId).toBe(eventId);
    expect(createChannelMock).toHaveBeenCalledWith(expect.objectContaining({ confirm: true }));
  });
});
