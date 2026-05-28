import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NotifyDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @ApiProperty({ example: 'Order paid' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
