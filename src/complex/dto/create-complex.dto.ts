import { ApiProperty } from '@nestjs/swagger';
import { Field } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

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
  @IsNumber()
  @IsNotEmpty()
  phone: number;

  @ApiProperty({
    example: 'contact@complexe-foot.tn',
    description: 'Adresse email du complexe',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  
}
