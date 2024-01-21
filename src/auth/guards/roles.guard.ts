import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AccessControlService } from '../access-control.service';
import { ROLES_KEY } from '../decorators/role.decorator';
import { Role } from '../enum/role.enum';
import { UserRequest } from '../types/user-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private accessControlService: AccessControlService,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<UserRequest>();
        for (const role of requiredRoles) {
            const result = this.accessControlService.isAuthorized({
                requiredRole: role,
                currentRole: user?.roles[0],
            });

            if (result) {
                return true;
            }
        }

        return false;
    }
}
