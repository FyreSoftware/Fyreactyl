export interface IUser {
  username: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  timestamp?: Date;
}
