import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MediaDocument, MediaSchema } from '@/tembre/shared/schema/media.schema';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/tembre/auth/enum/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            delete ret._id;
            delete ret.password;
            delete ret.googleId;
            delete ret.facebookId;
        },
    },
})
export class User {
    @ApiProperty({ type: 'string' })
    id: string;

    @ApiProperty({ type: 'string' })
    @Prop({ required: true })
    firstName: string;

    @ApiProperty({ type: 'string' })
    @Prop({ required: true })
    lastName: string;

    @ApiProperty({ type: 'string' })
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ unique: true })
    emailCanonical: string;

    @Prop({})
    password: string;

    @ApiProperty({ type: 'string', required: false })
    @Prop()
    dob?: Date;

    @ApiProperty({ type: 'string' })
    @Prop({ type: MediaSchema })
    image: MediaDocument;

    @ApiProperty({ type: 'string' })
    @Prop({ required: true })
    roles: Role[] = [Role.User];

    @Prop()
    googleId?: string;

    @Prop()
    facebookId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
