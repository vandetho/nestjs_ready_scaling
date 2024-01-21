import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDTO {
    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    password?: string;

    @ApiProperty({ required: false })
    facebookId?: string;

    @ApiProperty({ required: false })
    googleId?: string;
}
