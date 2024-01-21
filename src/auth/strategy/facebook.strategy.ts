import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_REDIRECT_URL,
            scope: 'email',
            profileFields: ['emails', 'name'],
        });
    }

    async validate(
        accessToken: string,
        _: string,
        profile: Profile,
    ): Promise<Payload> {
        const { id, name, emails } = profile;
        return {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            providerId: id,
            provider: 'facebook',
        };
    }
}
