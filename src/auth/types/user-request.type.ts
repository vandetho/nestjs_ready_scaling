import { Request } from 'express';
import { UserDocument } from '../../user/schema/user.schema';

export interface UserRequest extends Request {
    user: UserDocument;
}
