import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
    @ApiPropertyOptional({
        description: 'Rating from 1 to 5 stars',
        minimum: 1,
        maximum: 5,
        example: 4,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @ApiPropertyOptional({
        description: 'Optional comment about the field',
        example: 'Updated: Good field but could be better maintained',
    })
    @IsString()
    @IsOptional()
    comment?: string;
}