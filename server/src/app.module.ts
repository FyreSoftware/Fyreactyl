import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './modules/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';
import bcrypt from 'bcrypt';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function (next: any) {
            if (!this.isModified('password')) {
              next();
            } else {
              const salt = await bcrypt.genSalt(10);
              (this as any).password = await bcrypt.hash(
                (this as any).password,
                salt,
              );
            }
          });
          return schema;
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
