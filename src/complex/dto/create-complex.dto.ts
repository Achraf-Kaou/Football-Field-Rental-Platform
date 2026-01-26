import { ApiProperty } from '@nestjs/swagger';
import { Field } from '@prisma/client';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateComplexDto {
  @ApiProperty({
    example: 'Complexe sportif El Menzah',
    description: 'Nom du complexe sportif',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'Rue de la République, Tunis',
    description: 'Adresse complète du complexe',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  address: string;

  @ApiProperty({
    example: 'Complexe avec 3 terrains de foot synthétiques et vestiaires.',
    description: 'Description du complexe',
    required: false,
  })
  @IsString()
  @Length(0, 500)
  description: string;

  @ApiProperty({
    example: '+12345678',
    description: 'Numéro de téléphone du complexe',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'contact@complexe-foot.tn',
    description: 'Adresse email du complexe',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: ['https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'],
    description: 'Array of image URLs from Cloudinary',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    example: ['foot', 'basketball'],
    description: 'Array of tags for the complex',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: '08:00',
    description: 'Opening time of the complex',
    required: false,
  })
  @IsString()
  @IsOptional()
  openAt?: string;

  @ApiProperty({
    example: '22:00',
    description: 'Closing time of the complex',
    required: false,
  })
  @IsString()
  @IsOptional()
  closeAt?: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the user who owns the complex',
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

