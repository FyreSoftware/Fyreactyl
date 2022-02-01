import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { IUser } from "../../types";

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, username } = req.body as IUser;

    const user = User.build({
      email,
      password,
      username,
    });

    const data = await user.save();

    res.status(201).json({
      success: true,
      user: data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const loginController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send("Login Route");
};

export const forgotPasswordController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send("Forgot Password Route");
};

export const resetPasswordController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send("Reset Password Route");
};
