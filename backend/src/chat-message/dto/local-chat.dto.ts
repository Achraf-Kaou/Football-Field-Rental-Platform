import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class LocalChatDto {
    @ApiProperty({
        example: 'Hello',
        description: 'User message',
    })
    @IsString()
    @MaxLength(5000)
    message: string;

    @ApiProperty({
        example: 'en',
        description: 'Language code',
        required: false,
    })
    @IsString()
    @IsOptional()
    language?: string;
}
