import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { Payload } from '../types/payload';

@Injectable()
export class GoogleOauthStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            // Put config in `.env`
            clientID: process.env.OAUTH_GOOGLE_ID,
            clientSecret: process.env.OAUTH_GOOGLE_SECRET,
            callbackURL: process.env.OAUTH_GOOGLE_REDIRECT_URL,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
    ): Promise<Payload> {
        const { id, name, emails } = profile;

        return {
            provider: 'google',
            providerId: id,
            firstName: name.givenName,
            lastName: name.familyName,
            email: emails[0].value,
        };
    }
}
