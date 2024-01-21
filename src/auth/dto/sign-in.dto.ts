import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
    @ApiProperty()
    emailOrUsername: string;

    @ApiProperty()
    password: string;
}
