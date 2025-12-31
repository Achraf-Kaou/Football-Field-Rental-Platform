import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Complex } from '@prisma/client';

export class FindAllComplexDto {
    @ApiProperty({
        example: 1,
        description: 'Page number for pagination',
        required: false,
        default: 1,
        minimum: 1
    })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiProperty({
        example: 10,
        description: 'Number of items per page',
        required: false,
        default: 10,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @ApiProperty({
        example: 'john',
        description: 'Search term to filter users by name or email',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        example: true,
        description: 'open or close',
        required: false
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({
        example: 'createdAt',
        description: 'Field to sort by',
        required: false,
        enum: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt', 'updatedAt']
    })
    @IsOptional()
    @IsString()
    sortedBy?: keyof Complex;

    @ApiProperty({
        example: 'desc',
        description: 'Sort direction',
        required: false,
        enum: ['asc', 'desc'],
        default: 'desc'
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortedDirection?: 'asc' | 'desc' = 'desc';
}