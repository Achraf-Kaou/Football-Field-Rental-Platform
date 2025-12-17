import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the user sending the message',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  senderId: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the user receiving the message',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  receiverId: number;

  @ApiProperty({
    example: 'Hello, is the field available tomorrow?',
    description: 'Content of the message',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @ApiProperty({
    example: 'sent',
    description: 'Status of the message (sent, delivered, read)',
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  })
  @IsString()
  status?: string = 'sent';
}
