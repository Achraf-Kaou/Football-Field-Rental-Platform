import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, User } from '@prisma/client';

export class Review {
    @ApiProperty({
        description: 'Unique identifier of the review',
        example: 1,
    })
    id: number;

    @ApiProperty({
        description: 'Rating from 1 to 5 stars',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    rating: number;

    @ApiPropertyOptional({
        description: 'Optional comment about the field',
        example: 'Great field with excellent conditions!',
    })
    comment?: string | null;

    @ApiProperty({
        description: 'ID of the user who wrote the review',
        example: 1,
    })
    userId: number;

    @ApiProperty({
        description: 'ID of the field being reviewed',
        example: 1,
    })
    fieldId: number;

    @ApiProperty({
        description: 'Timestamp when the review was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Timestamp when the review was last updated',
        example: '2024-01-15T10:30:00Z',
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        description: 'Timestamp when the review was deleted (soft delete)',
        example: null,
    })
    deletedAt?: Date | null;

    // Optional relations
    user?: User;

    field?: Field;
}