import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class ChatAnalyticsQueryDto {
    @ApiProperty({
        example: 1,
        description: 'Filter by user ID',
        required: false,
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    userId?: number;

    @ApiProperty({
        example: '2024-01-01',
        description: 'Start date for analytics',
        required: false,
    })
    @IsString()
    @IsOptional()
    startDate?: string;

    @ApiProperty({
        example: '2024-12-31',
        description: 'End date for analytics',
        required: false,
    })
    @IsString()
    @IsOptional()
    endDate?: string;
}
