import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
    @ApiProperty()
    email: string;

    @ApiProperty()
    provider: 'facebook' | 'google';

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    providerId: string;
}
