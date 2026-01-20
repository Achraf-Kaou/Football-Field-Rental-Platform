import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for individual availability slot
export class AvailabilitySlotDto {
  @ApiProperty({
    example: 1234567890,
    description: 'Unique identifier for the slot',
  })
  @IsInt()
  id: number;

  @ApiProperty({
    example: '2026-01-11',
    description: 'Date in ISO format (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '09:00',
    description: 'Start time in HH:MM format',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '10:00',
    description: 'End time in HH:MM format',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    example: 'available',
    description: 'Status of the time slot',
    enum: ['available', 'maintenance', 'blocked'],
  })
  @IsEnum(['available', 'maintenance', 'blocked'])
  status: 'available' | 'maintenance' | 'blocked';

  @ApiProperty({
    example: 'Peak hours - high demand',
    description: 'Optional notes about the slot',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this slot recurs weekly',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  recurring?: boolean;

  @ApiProperty({
    example: '2026-01-11T08:00:00.000Z',
    description: 'ISO timestamp when slot was created',
  })
  @IsString()
  @IsNotEmpty()
  createdAt: string;
}

export class CreateFieldDto {
  @ApiProperty({
    example: 'Terrain A',
    description: 'Name of the field',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'Synthetic grass football field with lighting',
    description: 'Description of the field',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  description: string;

  @ApiProperty({
    example: 'Football',
    description: 'Type of the field (Football, Basketball, Tennis, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 450.5,
    description: 'Surface area of the field in square meters',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  surface: number;

  @ApiProperty({
    example: 80.0,
    description: 'Price per hour in TND',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'available',
    description: 'Status of the field (available, maintenance, unavailable)',
    enum: ['available', 'maintenance', 'unavailable'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: [
      'https://example.com/images/field1.jpg',
      'https://example.com/images/field2.jpg',
    ],
    description: 'Array of image URLs for the field',
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    example: 1,
    description: 'ID of the complex this field belongs to',
  })
  @Type(() => Number)
  @IsInt()
  complexId: number;

  @ApiProperty({
    example: [
      {
        id: 1234567890,
        date: '2026-01-11',
        startTime: '09:00',
        endTime: '10:00',
        status: 'available',
        notes: 'Peak hours',
        recurring: false,
        createdAt: '2026-01-11T08:00:00.000Z',
      },
    ],
    description: 'Optional array of availability time slots for the field',
    required: false,
    type: [AvailabilitySlotDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability?: AvailabilitySlotDto[];
}

// TypeScript interface for type safety (same structure as AvailabilitySlotDto)
export interface AvailabilitySlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'maintenance' | 'blocked';
  notes?: string;
  recurring?: boolean;
  createdAt: string;
}