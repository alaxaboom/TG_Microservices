# TG Microservices

Three NestJS services:
- `producer-service` publishes events to RabbitMQ.
- `consumer-service` consumes events, applies retry policy, and pushes failed messages to DLQ.
- `telegram-service` sends messages via Telegram Bot API with idempotency safeguard.

## RabbitMQ Topology

- Exchange: `notifications.exchange` (`direct`)
- Queue: `telegram.queue`
- Routing key: `notification.telegram`
- Retry queues: `telegram.retry.5s`, `telegram.retry.30s`
- DLQ: `telegram.dlq`

Retry chain:
1. attempt 1
2. retry after 5s
3. retry after 30s
4. move to DLQ

## Endpoints

- Producer:
  - `POST /notify`
  - `GET /health`
  - `GET /docs`
- Consumer:
  - `GET /health`
- Telegram:
  - `POST /send`
  - `GET /health`
  - `GET /docs`

## Basic local flow

1. Set bot token in `apps/telegram-service/.env.example`.
2. Start stack with docker compose from `deploy`.
3. Call `POST /notify` in producer.
4. Observe processing logs and RabbitMQ queues.

## Local run without Docker

If Docker is unavailable on your machine:

1. Use any reachable RabbitMQ instance (local install or remote host).
2. Create real `.env` files from `.env.example` in:
   - `apps/producer-service/.env`
   - `apps/consumer-service/.env`
   - `apps/telegram-service/.env`
3. Set the same RabbitMQ URL in producer and consumer `.env`.
4. Build all:
   - `npm run build:all`
5. Start each service in a separate terminal:
   - `npm run start:dev --workspace=producer-service`
   - `npm run start:dev --workspace=consumer-service`
   - `npm run start:dev --workspace=telegram-service`

## Docker run for reviewer/server

When Docker is available:

1. Ensure env files exist (copy from examples if needed).
2. Run from `deploy`:
   - `docker compose up --build`
