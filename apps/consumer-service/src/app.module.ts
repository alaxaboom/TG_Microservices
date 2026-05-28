import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { ConsumerRunnerService } from './services/consumer-runner.service';
import { TelegramClientService } from './services/telegram-client.service';
import { ProcessedEventsRepository } from './services/processed-events.repository';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController],
  providers: [ConsumerRunnerService, TelegramClientService, ProcessedEventsRepository],
})
export class AppModule {}
