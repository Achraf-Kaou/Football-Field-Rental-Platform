import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatMessageDto {
    @ApiProperty({
        example: 1,
        description: 'User ID (optional for anonymous chats)',
        required: false,
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    userId?: number;

    @ApiProperty({
        example: 'Hello, I need help with booking',
        description: 'User message',
    })
    @IsString()
    @MaxLength(5000)
    message: string;

    @ApiProperty({
        example: 'How can I assist you with booking?',
        description: 'Chatbot response',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(5000)
    response?: string;

    @ApiProperty({
        example: 'en',
        description: 'Language code (en, ar, fr, etc.)',
        required: false,
    })
    @IsString()
    @IsOptional()
    language?: string;
}
