import { MongooseModule } from '@nestjs/mongoose';
import 'dotenv/config';

export const database = process.env.MONGO_URI_DEV;

export const imports = [
    MongooseModule.forRoot(database),
    AuthModule,
    UserModule,
];
