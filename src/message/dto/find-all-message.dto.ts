import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsIn, IsOptional, IsString, Min } from 'class-validator';

export class FindAllMessageDto {
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
    example: 20,
    description: 'Number of messages per page',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
    enum: ['id', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortedBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'asc',
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortedDirection?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by sender ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  senderId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Filter by receiver ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  receiverId?: number;

  @ApiPropertyOptional({
    example: 'read',
    description: 'Filter by message status',
    enum: ['sent', 'delivered', 'read'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
