import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the user making the booking',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the field to book',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fieldId: number;

  @ApiProperty({
    example: '2025-12-20T14:00:00.000Z',
    description: 'Start date and time of the booking',
  })
  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({
    example: '2025-12-20T16:00:00.000Z',
    description: 'End date and time of the booking',
  })
  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @ApiProperty({
    example: 'pending',
    description: 'Status of the booking (pending, confirmed, cancelled, completed)',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
