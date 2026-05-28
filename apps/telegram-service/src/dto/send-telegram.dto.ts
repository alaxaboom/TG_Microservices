import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendTelegramDto {
  @ApiProperty({ example: '92f4db35-f4b8-4ed9-bfef-dd90a2db1803' })
  @IsUUID()
  eventId!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @ApiProperty({ example: 'Payment accepted' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ example: 'consumer-service' })
  @IsString()
  @IsNotEmpty()
  source!: string;
}
