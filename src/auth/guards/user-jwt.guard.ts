import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../user/user.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class UserJwtGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token && !isPublic) {
            throw new UnauthorizedException('Missing jwt token');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });
            request['user'] = await this.userService.findExistById(payload.sub);
        } catch (e) {
            if (!isPublic) {
                throw new UnauthorizedException(e.message);
            }
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if (request.cookies && request.cookies.jt) {
            return request.cookies.jt;
        }

        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
