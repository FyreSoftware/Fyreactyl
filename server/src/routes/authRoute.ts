import express from "express";
import {
  forgotPasswordController,
  loginController,
  registerController,
  resetPasswordController,
} from "../controllers";

const router = express.Router();

router.route("/register").post(registerController);
router.route("/login").post(loginController);
router.route("/forgotpassword").post(forgotPasswordController);
router.route("/resetpassword/:resetToken").put(resetPasswordController);

export default router;
