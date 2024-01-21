import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RefreshTokenService } from '../user/refresh-token.service';
import { User, UserDocument } from '../user/schema/user.schema';
import { JwtTokenDTO } from './dto/jwt-token.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userService.findUserEmail(email);
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (user && isPasswordMatch) {
            return user;
        }
        return null;
    }

    async login(signInDto: SignInDto, ipAddress: string): Promise<JwtTokenDTO> {
        const user = await this.userService.findByLogin(signInDto);
        return this.generateAccessToken(user, ipAddress);
    }

    async loginFacebook(
        email: string,
        ipAddress: string,
    ): Promise<JwtTokenDTO> {
        const user = await this.userService.findByEmail(email);
        return this.generateAccessToken(user, ipAddress);
    }

    async generateAccessToken(user: UserDocument, ipAddress: string) {
        const payload = {
            email: user.emailCanonical,
            sub: user._id,
            roles: user.roles,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: Number(process.env.JWT_EXPIRES_TIME),
        });

        const refreshToken =
            await this.refreshTokenService.generateRefreshToken(
                user,
                ipAddress,
            );

        return { user, accessToken, refreshToken: refreshToken.token };
    }
}
