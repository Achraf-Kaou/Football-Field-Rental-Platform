import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get<string>('FACEBOOK_APP_ID');
        const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
        const callbackURL = configService.get<string>('FACEBOOK_CALLBACK_URL');

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('Facebook OAuth credentials not configured');
        }
        super({
            clientID: clientID,
            clientSecret: clientSecret,
            callbackURL: callbackURL,
            scope: ['email'],
            profileFields: ['emails', 'name'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { name, emails, id } = profile;
        const user = {
            email: emails?.[0]?.value,
            firstName: name?.givenName,
            lastName: name?.familyName,
            facebookId: id,
            accessToken,
        };
        done(null, user);
    }
}
