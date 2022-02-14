import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getUser(email: string): string {
    return 'Hello World!';
  }
}
