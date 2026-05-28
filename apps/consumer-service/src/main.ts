import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsumerRunnerService } from './services/consumer-runner.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const consumerRunner = app.get(ConsumerRunnerService);
  await consumerRunner.start();

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);

  const shutdown = async (): Promise<void> => {
    await app.close();
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}
bootstrap();
