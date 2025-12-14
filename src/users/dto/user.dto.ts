import { IsEmail, IsInt, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    password: string;

    @ApiProperty({ example: '123456789' })
    @IsInt()
    phone: number;

    @ApiProperty({ example: 'ADMIN' })
    @IsString()
    @IsEnum(Role)
    role: Role;
}
