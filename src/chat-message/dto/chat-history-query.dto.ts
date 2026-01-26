import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class ChatHistoryQueryDto {
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
        example: 50,
        description: 'Number of messages to retrieve',
        required: false,
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}