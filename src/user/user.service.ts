import { Model } from 'mongoose';
import {
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { SignInDto } from '../auth/dto/sign-in.dto';
import { UserDocument } from './schema/user.schema';
import { CreateUserDTO } from './dto/create-user.dto';
import { Role } from '../auth/enum/role.enum';

@Injectable()
export class UserService {
    constructor(
        @InjectModel('User')
        private readonly userModel: Model<UserDocument>,
    ) {}

    async createUser(createUserDTO: CreateUserDTO) {
        const user = await this.userModel.findOne({
            emailCanonical: createUserDTO.email.toLowerCase(),
        });
        if (user) {
            throw new HttpException(
                'User email already exists',
                HttpStatus.BAD_REQUEST,
            );
        }
        return await this.userModel.create({
            ...createUserDTO,
            roles: [Role.User],
            password:
                createUserDTO.password &&
                (await bcrypt.hash(createUserDTO.password, 12)),
            emailCanonical: createUserDTO.email.toLowerCase(),
        });
    }

    async findByLogin(signInDto: SignInDto) {
        const { emailOrUsername, password } = signInDto;
        const user = await this.userModel.findOne(
            isEmail(emailOrUsername)
                ? {
                      emailCanonical: emailOrUsername.toLowerCase(),
                  }
                : { usernameCanonical: emailOrUsername.toLowerCase() },
        );
        if (!user) {
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (await bcrypt.compare(password, user.password)) {
            return user;
        } else {
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }
    }

    async findUserEmail(email: string): Promise<UserDocument | undefined> {
        return this.userModel.findOne({ emailCanonical: email.toLowerCase() });
    }

    async findById(id: string): Promise<UserDocument | undefined> {
        return this.userModel.findById(id).exec();
    }

    async findExistById(id: string): Promise<UserDocument | undefined> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new UnauthorizedException('Invalid JWT Token');
        }
        return user;
    }

    /**
     * Find a user by its username
     * @param {string} username
     */
    async findByUsername(username: string) {
        return this.userModel
            .findOne({
                usernameCanonical: username.toLowerCase(),
            })
            .exec();
    }

    /**
     * Find a user by its e-mail
     * @param {string} email
     * @return {Promise<UserDocument | undefined>}
     */
    async findByEmail(email: string): Promise<UserDocument | undefined> {
        return this.userModel
            .findOne({
                emailCanonical: email?.toLowerCase(),
            })
            .exec();
    }

    async findByFacebookId(facebookId: string) {
        return this.userModel.findOne({ facebookId }).exec();
    }

    async findByGoogleId(googleId: string) {
        return this.userModel.findOne({ googleId }).exec();
    }

    async deleteUser(user: UserDocument) {
        return this.userModel.findByIdAndDelete(user._id);
    }
}
