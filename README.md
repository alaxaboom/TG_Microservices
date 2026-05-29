# TG Microservices

Реализованы producer/consumer/telegram на NestJS + RabbitMQ + Docker. Добавлены publisher confirms, Redis-идемпотентность, retry/DLQ, Swagger и unit/e2e тесты.

Три сервиса на NestJS:

- `producer-service` -> принимает `POST /notify` и отправляет событие в RabbitMQ
- `consumer-service` -> читает очередь, делает retry и отправляет в `telegram-service`
- `telegram-service` -> отправляет сообщение в Telegram Bot API

Полноценную clean architecture (domain-слой, shared libs, порты/адаптеры) намеренно не выносил: для объёма тестового задания это лишняя сложность, а текущее разделение на controller / service / infrastructure уже даёт понятную структуру и изоляцию ответственности.

RabbitMQ:

- Exchange: `notifications.exchange`
- Queue: `telegram.queue`
- Routing key: `notification.telegram`
- Retry: `5s -> 30s -> DLQ`
- DLQ: `telegram.dlq` (routing key: `notification.dlq`)
- Невалидные сообщения из основной очереди уходят в DLQ через dead-letter

Redis:

- Общее хранилище идемпотентности для `consumer-service` и `telegram-service`
- Префикс ключей: `processed-events:notification:{eventId}`

## Запуск через Docker

1. Создай файлы:
   - `apps/producer-service/.env`
   - `apps/consumer-service/.env`
   - `apps/telegram-service/.env`
2. Скопируй значения из `.env.example`

   Или командой:

   ```bash
   cp apps/producer-service/.env.example apps/producer-service/.env
   cp apps/consumer-service/.env.example apps/consumer-service/.env
   cp apps/telegram-service/.env.example apps/telegram-service/.env
   ```

3. Сделай телеграмм бота, чтобы получить токен и вставить его в  `apps/telegram-service/.env` в поле `TELEGRAM_BOT_TOKEN`
4. Запусти из корневой папки:

```bash
docker compose up --build -d
```

Проверка:

- `http://<HOST>:3001/health`
- `http://<HOST>:3002/health`
- `http://<HOST>:3003/health`
- `http://<HOST>:3001/docs`
- `http://<HOST>:3003/docs`
- `http://<HOST>:15672` (RabbitMQ UI)

Tests:

```bash
npm test --workspace=producer-service
npm test --workspace=consumer-service
npm test --workspace=telegram-service
npm run test:e2e --workspace=producer-service
npm run test:e2e --workspace=consumer-service
npm run test:e2e --workspace=telegram-service
```

Тестовый запрос:

`POST http://<HOST>:3001/notify`

```json
{
  "chatId": "айди_чата",
  "message": "Test message from microservices"
}
```
