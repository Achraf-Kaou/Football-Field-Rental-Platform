import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    example: 1,
    description: 'ID of the complex this field belongs to',
  })
  @Type(() => Number)
  @IsInt()
  complexId: number;
}
