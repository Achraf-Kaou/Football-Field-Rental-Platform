import { User } from '@prisma/client';

export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password' | 'refreshToken'>;
}
