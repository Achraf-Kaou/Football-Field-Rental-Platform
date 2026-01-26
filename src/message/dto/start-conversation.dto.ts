import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StartConversationDto {
    @ApiProperty({
        example: 1,
        description: 'ID of the current user',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    currentUserId: number;

    @ApiProperty({
        example: 2,
        description: 'ID of the user to start conversation with',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    targetUserId: number;

    @ApiProperty({
        example: 'Hi! I saw your field listing...',
        description: 'Initial message content (optional)',
    })
    @IsOptional()
    @IsString()
    @Length(1, 1000)
    initialMessage?: string;
}