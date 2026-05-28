export interface RetryPolicyStep {
  queue: string;
  delayMs: number;
}

export const TELEGRAM_RETRY_POLICY: ReadonlyArray<RetryPolicyStep> = [
  { queue: 'telegram.retry.5s', delayMs: 5000 },
  { queue: 'telegram.retry.30s', delayMs: 30000 },
];

export const DEFAULT_RABBITMQ_URL = 'amqp://guest:guest@rabbitmq:5672';
