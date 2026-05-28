
Три сервиса на NestJS:

- `producer-service` -> принимает `POST /notify` и отправляет событие в RabbitMQ
- `consumer-service` -> читает очередь, делает retry и отправляет в `telegram-service`
- `telegram-service` -> отправляет сообщение в Telegram Bot API

RabbitMQ:

- Exchange: `notifications.exchange`
- Queue: `telegram.queue`
- Routing key: `notification.telegram`
- Retry: `5s -> 30s -> DLQ`
- DLQ: `telegram.dlq`

## Быстрый запуск через Docker

1. Создай файлы:
   - `apps/producer-service/.env`
   - `apps/consumer-service/.env`
   - `apps/telegram-service/.env`
2. Скопируй значения из `.env.example`
   
 Или командой 

 ```bash
cp .env.example .env
```

 можно сразу создать .env из .env.example 
 
3. В `apps/telegram-service/.env` укажи реальный `TELEGRAM_BOT_TOKEN`
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

Тестовый запрос:

`POST http://<HOST>:3001/notify`

```json
{
  "chatId": "айди_чата",
  "message": "Test message from microservices"
}
```
