import { User } from '../../user/schema/user.schema';

export interface JwtTokenDTO {
    accessToken: string;
    refreshToken: string;
    user: User;
}
