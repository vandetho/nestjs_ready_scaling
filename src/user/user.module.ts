import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '@/tembre/auth/auth.module';
import { User, UserSchema } from '@/tembre/user/schema/user.schema';
import { RefreshToken, RefreshTokenSchema } from '@/tembre/user/schema/refresh-token.schema';
import { UserController } from '@/tembre/user/user.controller';
import { RefreshTokenService } from '@/tembre/user/refresh-token.service';
import { EventModule } from '@/tembre/event/event.module';
import { ActivityModule } from '@/tembre/activity/activity.module';
import { TutorModule } from '@/tembre/tutor/tutor.module';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        forwardRef(() => ActivityModule),
        forwardRef(() => EventModule),
        forwardRef(() => TutorModule),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_TIME) },
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: RefreshToken.name, schema: RefreshTokenSchema },
        ]),
    ],
    controllers: [UserController],
    providers: [UserService, RefreshTokenService],
    exports: [UserService, RefreshTokenService],
})
export class UserModule {}
