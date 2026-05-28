export const NOTIFICATIONS_EXCHANGE = 'notifications.exchange';
export const TELEGRAM_QUEUE = 'telegram.queue';
export const TELEGRAM_DLQ = 'telegram.dlq';
export const TELEGRAM_ROUTING_KEY = 'notification.telegram';

export interface TelegramNotificationPayload {
  chatId: string;
  message: string;
}

export interface NotificationEvent {
  eventId: string;
  type: 'notification.telegram';
  payload: TelegramNotificationPayload;
  createdAt: string;
}
