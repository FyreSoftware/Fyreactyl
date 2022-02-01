import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../types";

interface UserDoc extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  timestamp: Date;
}

interface IUserSchema extends mongoose.Model<UserDoc> {
  build(attr: IUser): UserDoc;
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username required."],
    },
    email: {
      type: String,
      required: [true, "Email required."],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Invalid email.",
      ],
    },
    password: {
      type: String,
      required: [true, "Password required."],
      minlength: 6,
      select: false,
    },
    timestamp: {
      type: Date,
      default: Date.now(),
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { collection: "users" }
);

UserSchema.statics.build = (attr: IUser) => {
  return new User(attr);
};

UserSchema.pre("save", async function (this: UserDoc, next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model<UserDoc, IUserSchema>("User", UserSchema);

export default User;
