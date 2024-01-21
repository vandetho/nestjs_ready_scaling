import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RefreshToken, RefreshTokenDocument } from '@/tembre/user/schema/refresh-token.schema';
import { UserService } from '@/tembre/user/user.service';
import { JwtTokenDTO } from '@/tembre/auth/dto/jwt-token.dto';
import { User } from '@/tembre/user/schema/user.schema';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectModel('RefreshToken')
        private readonly refreshTokenModel: Model<RefreshTokenDocument>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async refreshToken({ token }: { token: string | undefined; ipAddress: string }) {
        if (token) {
            const refreshToken = await this.getRefreshToken(token);
            return await this.generateJwtToken(refreshToken);
        }

        throw new HttpException('Missing Refresh Token', HttpStatus.UNAUTHORIZED);
    }

    async generateJwtToken(refreshToken: RefreshToken): Promise<JwtTokenDTO> {
        const user = await this.userService.findById(String(refreshToken.user));
        const payload = {
            email: user.emailCanonical,
            sub: user._id,
            roles: user.roles,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: Number(process.env.JWT_EXPIRES_TIME),
        });
        return {
            user,
            accessToken,
            refreshToken: refreshToken.token,
        };
    }

    async generateRefreshToken(user: User, ipAddress: string) {
        return await this.refreshTokenModel.create({
            user,
            token: this.randomTokenString(),
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdByIp: ipAddress,
        });
    }

    async getRefreshToken(token: string) {
        const refreshToken = await this.refreshTokenModel.findOne({ token });
        if (!refreshToken || this.isExpired(refreshToken)) {
            throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
        }

        return refreshToken;
    }

    randomTokenString() {
        return crypto.randomBytes(40).toString('hex');
    }

    isExpired(refreshToken: RefreshTokenDocument) {
        return Date.now() >= refreshToken.expires.getTime();
    }
}
