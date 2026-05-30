import { Role, User } from "@prisma/client";
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllUsersDto {
    @ApiProperty({
        example: 1,
        description: 'Page number for pagination',
        required: false,
        default: 1,
        minimum: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        example: 10,
        description: 'Number of items per page',
        required: false,
        default: 10,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiProperty({
        example: 'john',
        description: 'Search term to filter users by name or email',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        example: 'createdAt',
        description: 'Field to sort by',
        required: false,
        enum: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt', 'updatedAt']
    })
    @IsOptional()
    @IsString()
    sortedBy?: keyof User;

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

    @ApiProperty({
        example: 'USER',
        description: 'Filter by user role',
        required: false,
        enum: Role
    })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}