import { Request } from 'express';
import { Payload } from './payload';

export interface PayloadRequest extends Request {
    user: Payload;
}
