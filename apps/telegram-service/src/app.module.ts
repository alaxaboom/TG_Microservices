import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { TelegramController } from './controllers/telegram.controller';
import { ProcessedEventsRepository } from './services/processed-events.repository';
import { TelegramApiService } from './services/telegram-api.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, TelegramController],
  providers: [ProcessedEventsRepository, TelegramApiService],
})
export class AppModule {}
