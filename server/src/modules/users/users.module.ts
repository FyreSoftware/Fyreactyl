import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersGateway } from '../gateway/users.gateway';
import { UsersController } from './users.controller';
@Module({
  providers: [UsersService, UsersGateway],
  controllers: [UsersController],
})
export class UsersModule {}
