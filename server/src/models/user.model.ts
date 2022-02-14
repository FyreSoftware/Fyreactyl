import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
const saltRounds = 10;

export type IUser = User & mongoose.Document;
@Schema()
export class User {
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  name: string;

  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  email: string;

  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
