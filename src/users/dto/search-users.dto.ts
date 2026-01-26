import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SearchUsersDto {
    @ApiPropertyOptional({
        example: 'john',
        description: 'Search query for user name or email',
    })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number for pagination',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of users per page',
        default: 10,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        example: 1,
        description: 'Exclude user ID from results (typically current user)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    excludeUserId?: number;
}