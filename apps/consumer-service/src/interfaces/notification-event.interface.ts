export interface NotificationEvent {
  eventId: string;
  type: 'notification.telegram';
  payload: {
    chatId: string;
    message: string;
  };
  createdAt: string;
}
