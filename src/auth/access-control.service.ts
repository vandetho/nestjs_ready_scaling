import { Injectable } from '@nestjs/common';
import { Role } from './enum/role.enum';

interface IsAuthorizedParams {
    currentRole: Role;
    requiredRole: Role;
}

@Injectable()
export class AccessControlService {
    private hierarchies: Array<Map<string, number>> = [];
    private priority: number = 1;

    constructor() {
        this.buildRoles([Role.User, Role.Member]);
        this.buildRoles([Role.User, Role.Employee, Role.Admin]);
    }

    /**
     * The buildRoles method allows for creating a role hierarchy between specified set of roles.
     * Roles have to be specified from the least privileged user to the most privileged one
     * @param roles Array that contains list of roles
     */
    private buildRoles(roles: Role[]) {
        const hierarchy: Map<string, number> = new Map();
        roles.forEach((role) => {
            hierarchy.set(role, this.priority);
            this.priority++;
        });
        this.hierarchies.push(hierarchy);
    }

    public isAuthorized({ currentRole, requiredRole }: IsAuthorizedParams) {
        for (const hierarchy of this.hierarchies) {
            const priority = hierarchy.get(currentRole);
            const requiredPriority = hierarchy.get(requiredRole);
            if (priority && requiredPriority && priority >= requiredPriority) {
                return true;
            }
        }
        return false;
    }
}
