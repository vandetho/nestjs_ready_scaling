import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/tembre/user/schema/user.schema';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
            delete ret.id;
            delete ret.user;
        },
    },
})
export class RefreshToken {
    id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

    @Prop()
    token: string;

    @Prop()
    expires: Date;

    @Prop({ type: Date, default: Date.now })
    created: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
