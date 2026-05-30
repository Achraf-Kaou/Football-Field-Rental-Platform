import { IsEmail, IsNotEmpty, IsString, MinLength, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'John', description: 'First name' })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'Last name' })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '12345678', description: 'Phone number' })
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ enum: Role, required: false, description: 'User role' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}