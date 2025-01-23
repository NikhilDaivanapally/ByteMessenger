import { Router } from "express";
import {
  RegisterUser,
  forgotpassword,
  googleLogin,
  loginFailed,
  loginSuccess,
  loginUser,
  logout,
  resetpassword,
  sendOTP,
  verifyOTP,
} from "../controllers/auth.controller.js";
import { upload } from "../middelwares/multer.middleware.js";
import { ensureAuthenticated } from "../middelwares/auth.middleware.js";
import passport from "passport";

const router = Router();

router.post("/register", upload.single("avatar"), RegisterUser, sendOTP);
router.post("/send-otp", sendOTP);
router.post("/verifyotp", verifyOTP);
router.post("/login", passport.authenticate("local"), loginUser);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password", resetpassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", googleLogin);
router.get("/login/success", ensureAuthenticated, loginSuccess);
router.get("/login/failed", loginFailed);

router.post("/logout", ensureAuthenticated, logout);

export default router;
