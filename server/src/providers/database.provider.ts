import * as mongoose from 'mongoose';
import environment from '../config/index.config';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(environment.database),
  },
];
