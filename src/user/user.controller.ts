import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { UserService } from '@/tembre/user/user.service';
import { UserRequest } from '@/tembre/auth/types/user-request.type';
import { Public } from '@/tembre/auth/decorators/public.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from '@/tembre/user/dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, parse } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { TokenHelper } from '@/tembre/shared/helpers/token.helper';
import { EventService } from '@/tembre/event/event.service';
import { User } from '@/tembre/user/schema/user.schema';
import { ActivityService } from '@/tembre/activity/activity.service';
import { TutorService } from '@/tembre/tutor/tutor.service';

const localOptions = {
    storage: diskStorage({
        destination: (_: UserRequest, _1, callback) => {
            const uploadPath = join('uploads', process.env.USER_IMAGE_FOLDER);
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }
            callback(null, uploadPath);
        },
        filename: (_: UserRequest, file, callback) => {
            callback(
                null,
                `${parse(file.originalname).name.toLowerCase()}-${TokenHelper.generateToken()}-${
                    process.env.IMAGE_PREFIX
                }${extname(file.originalname)}`
                    /* Replace all spacial characters with hyphen */
                    .replace(/([~!@#$%^&*()_+=`{}\[\]|\\:;'<>,.\/? ])+/g, '-')
                    /* Replace multiple hyphens with single hyphen */
                    .replace(/^(-)+|(-)+$/g, ''),
            );
        },
    }),
};

@ApiBearerAuth()
@Controller('/api/users')
@ApiTags('User')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly activityService: ActivityService,
        private readonly eventService: EventService,
        private readonly tutorService: TutorService,
    ) {}

    /**
     * Get current user profile
     * @param req
     */
    @Get('/me')
    @ApiOkResponse({
        description: 'Return current user profile',
        type: User,
    })
    async me(@Req() req: UserRequest) {
        return req.user;
    }

    @Delete('/me')
    @ApiOkResponse({
        description: 'Return current user profile',
    })
    async deleteMe(@Req() req: UserRequest) {
        return this.userService.deleteUser(req.user);
    }

    @Put('/me')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string',
                    description: 'User first name',
                },
                lastName: {
                    type: 'string',
                    description: 'User last name',
                },
                email: {
                    type: 'string',
                    description: 'User email',
                },
                dob: {
                    type: 'string',
                    format: 'date',
                    description: 'User dob',
                },
            },
        },
    })
    @ApiOkResponse({
        description: 'Return current user profile is updated',
    })
    async updateMe(@Req() req: UserRequest, @Body() updateUserDto: UpdateUserDto) {
        const user = req.user;
        user.firstName = updateUserDto.firstName;
        user.lastName = updateUserDto.lastName;
        if (updateUserDto.email) {
            user.email = updateUserDto.email;
            user.emailCanonical = updateUserDto.email.toLowerCase();
        }
        user.dob = updateUserDto.dob;
        return user.save();
    }

    @Post('/uploads')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'The image that will be uploaded if empty the current one will be deleted',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('image', localOptions))
    async uploadImage(@Req() req: UserRequest, @UploadedFile() thumbnail?: Express.Multer.File) {
        return this.userService.updateImage(thumbnail, req.user);
    }

    @Public()
    @Get('/check-username')
    async username(@Query('username') username: string) {
        const user = await this.userService.findByUsername(username);
        if (user) {
            throw new HttpException('User already existed', HttpStatus.BAD_REQUEST);
        }
        return '';
    }

    @Public()
    @Get('/check-email')
    async email(@Query('email') email: string) {
        const user = await this.userService.findByEmail(email);
        if (user) {
            throw new HttpException('User already existed', HttpStatus.BAD_REQUEST);
        }
        return '';
    }

    @Get('/activities')
    async activities(@Req() req: UserRequest) {
        return this.activityService.getUserActivities(req.user);
    }

    @Get('/events')
    async events(@Req() req: UserRequest) {
        return this.eventService.getUserEvents(req.user);
    }

    @Get('/tutors')
    async tutors(@Req() req: UserRequest) {
        return this.tutorService.getUserTutors(req.user);
    }

    @Public()
    @Get(':userId/profiles')
    async getUserProfiles(@Param('userId') userId: string) {
        return this.userService.findById(userId);
    }
}
