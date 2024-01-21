import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { GoogleOauthStrategy } from './strategy/google.strategy';
import { FacebookStrategy } from './strategy/facebook.strategy';
import { AccessControlService } from './access-control.service';

@Module({
    imports: [
        forwardRef(() => UserModule),
        PassportModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_TIME) },
        }),
    ],
    exports: [
        AuthService,
        GoogleOauthStrategy,
        FacebookStrategy,
        AccessControlService,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AccessControlService,
        GoogleOauthStrategy,
        FacebookStrategy,
    ],
})
export class AuthModule {}
