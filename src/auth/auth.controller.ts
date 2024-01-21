import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RefreshTokenService } from '../user/refresh-token.service';
import { Public } from './decorators/public.decorator';
import { UserRequest } from './types/user-request.type';
import { JwtTokenDTO } from './dto/jwt-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { FacebookGuard } from './guards/facebook.guard';
import { PayloadRequest } from './types/payload-request';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('/api')
@ApiTags('Auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private refreshTokenService: RefreshTokenService,
    ) {}

    @Post('sign-up')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Req() req: UserRequest,
        @Res({ passthrough: true }) response: Response,
        @Body() signUpDto: SignUpDto,
    ): Promise<JwtTokenDTO> {
        let user: any;
        if (signUpDto.provider === 'facebook') {
            user = await this.userService.findByFacebookId(
                signUpDto.providerId,
            );
            if (!user) {
                user = await this.userService.createUser({
                    email: signUpDto.email,
                    firstName: signUpDto.firstName,
                    lastName: signUpDto.lastName,
                    facebookId: signUpDto.providerId,
                });
            }
        } else if (signUpDto.provider === 'google') {
            user = await this.userService.findByGoogleId(signUpDto.providerId);
            if (!user) {
                user = await this.userService.createUser({
                    email: signUpDto.email,
                    firstName: signUpDto.firstName,
                    lastName: signUpDto.lastName,
                    googleId: signUpDto.providerId,
                });
            }
        } else {
            user = await this.userService.createUser(req.body);
        }
        const jwtToken = await this.authService.generateAccessToken(
            user,
            req.ip,
        );
        this.setCookies(response, jwtToken);
        return jwtToken;
    }

    @Post('sign-in')
    @Public()
    @HttpCode(HttpStatus.OK)
    async login(
        @Req() req: UserRequest,
        @Res({ passthrough: true }) response: Response,
        @Body() signInDto: SignInDto,
    ): Promise<JwtTokenDTO> {
        const jwtToken = await this.authService.login(signInDto, req.ip);
        if (jwtToken) {
            this.setCookies(response, jwtToken);
            return jwtToken;
        }

        throw new BadRequestException('Something went wrong');
    }

    @Post('sign-out')
    @Public()
    @HttpCode(HttpStatus.OK)
    async signOut(
        @Req() _: UserRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        response.cookie('jt', '', { expires: new Date() });
        response.cookie('rt', '', { expires: new Date() });
        // return await this.authService.login(req.body, req.ip);
    }

    @Post('refresh-token')
    @Public()
    @HttpCode(HttpStatus.OK)
    async refreshToken(
        @Req() req: UserRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<JwtTokenDTO> {
        const refreshToken = req.cookies
            ? req.cookies.rt
            : req.body.refreshToken;
        const ipAddress = req.ip;
        const jwtToken = await this.refreshTokenService.refreshToken({
            token: refreshToken,
            ipAddress,
        });
        this.setCookies(res, jwtToken);
        return jwtToken;
    }

    @Get('facebook')
    @Public()
    @UseGuards(FacebookGuard)
    facebook() {
        console.log('This controller should be blank - for facebook login');
    }

    @Get('facebook/redirect')
    @Public()
    @UseGuards(FacebookGuard)
    async facebookRedirect(
        @Req() req: PayloadRequest,
        @Res({ passthrough: true }) res: Response,
    ) {
        if (req.user) {
            const facebookId = req.user.providerId;
            const user = await this.userService.findByFacebookId(facebookId);
            if (user) {
                const jwtToken = await this.authService.generateAccessToken(
                    user,
                    req.ip,
                );
                this.setCookies(res, jwtToken);
                return jwtToken;
            }
        }
        // this.setCookies(res, jwtToken);
        return req.user;
    }

    @Get('google')
    @Public()
    @UseGuards(GoogleOauthGuard)
    google() {
        console.log('This controller should be blank - for google login');
    }

    @Get('google/redirect')
    @Public()
    @UseGuards(GoogleOauthGuard)
    async googleRedirect(
        @Req() req: PayloadRequest,
        @Res({ passthrough: true }) res: Response,
    ) {
        if (req.user) {
            const googleId = req.user.providerId;
            const user = await this.userService.findByGoogleId(googleId);
            if (user) {
                const jwtToken = await this.authService.generateAccessToken(
                    user,
                    req.ip,
                );
                this.setCookies(res, jwtToken);
                return jwtToken;
            }
        }
    }

    private setCookies(response: Response, jwtToken: JwtTokenDTO) {
        response.cookie('jt', jwtToken.accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            expires: new Date(Date.now() + 3600 * 1000),
        });
        response.cookie('rt', jwtToken.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            expires: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        });
    }
}
