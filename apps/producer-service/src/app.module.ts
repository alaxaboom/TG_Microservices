import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { NotificationController } from './controllers/notification.controller';
import { RabbitPublisherService } from './infrastructure/rabbit-publisher.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, NotificationController],
  providers: [RabbitPublisherService],
})
export class AppModule {}
