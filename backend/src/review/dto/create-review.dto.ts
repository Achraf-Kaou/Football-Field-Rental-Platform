import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({
        description: 'Rating from 1 to 5 stars',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    rating: number;

    @ApiPropertyOptional({
        description: 'Optional comment about the field',
        example: 'Great field with excellent conditions!',
    })
    @IsString()
    @IsOptional()
    comment?: string;

    @ApiProperty({
        description: 'ID of the field being reviewed',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    fieldId: number;

    @ApiProperty({
        description: 'ID of the user leaving the review',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    userId: number;
}