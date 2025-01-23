import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { filterObj } from "../utils/filterObj.js";
import otpGenerator from "otp-generator";
import crypto from "crypto";
import { sendMail } from "../services/mailer.js";
import { OTP } from "../Templates/Mail/otp.js";
import { ResetPassord } from "../Templates/Mail/resetPassword.js";
import passport from "passport";
const accessoptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24,
};

const refreshoptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 10,
};

const RegisterUser = async (req, res, next) => {
  // collect the Data from re body
  // In incoming data we get noraml data & avatar (image) to handle this we use multer & cloudinary
  const filteredBody = filterObj(
    req.body,
    "userName",
    "email",
    "password",
    "confirmPassword",
    "about",
    "gender"
  );
  if (Object.values(filteredBody).some((field) => field?.trim() === "")) {
    return res.status(400).json({
      status: "error",
      message: "All fields are Required",
    });
  }
  const existing_user = await User.findOne({ email: filteredBody.email });
  if (existing_user) {
    return res.status(409).json({
      status: "error",
      message: "Email already in use, Please login.",
    });
  }
  if (String(filteredBody.password) !== String(filteredBody.confirmPassword)) {
    return res.status(400).json({
      status: "error",
      message: "password and confirmPassword must be same",
    });
  }

  const avatarLocalpath = req.file?.path;

  let avatar;
  if (avatarLocalpath) {
    avatar = await uploadCloudinary(avatarLocalpath);
  }
  const new_user = await User.create({
    ...filteredBody,
    status: "Offline",
    avatar: avatar?.url || "",
  });

  req.userId = new_user._id;
  next();
};

// sendOtp
const sendOTP = async (req, res) => {
  try {
    const { userId } = req;
    // Generate OTP and calculate expiry time
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const otpExpiryTime = Date.now() + 10 * 60 * 1000; // 10 mins

    // Find user and update OTP and expiry time atomically
    const user = await User.findByIdAndUpdate(userId, {
      otp_expiry_time: otpExpiryTime,
    });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User Not found !",
      });
    }
    user.otp = otp.toString();

    await user.save({ new: true, validateModifiedOnly: true });
    // Send OTP email
    const emailSent = await sendMail({
      to: user.email,
      subject: "Verification OTP ✉️",
      html: OTP(user.userName, otp),
    });

    if (!emailSent) {
      return res.status(500).json({
        status: "error",
        message: "Failed to send OTP",
      });
    }

    // Respond with success
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully!",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send OTP",
    });
  }
};

// verifyOTP
const verifyOTP = async (req, res, next) => {
  //otp needs to be a string
  const { email, otp } = req.body;
  console.log(otp, email);
  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  }).select("-password");
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }
  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }
  const isValid = await user.isOtpCorrect(otp);
  if (!isValid) {
    return res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
  }

  // OTP is Correct
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  user.verified = true;
  user.otp = undefined;
  user.otp_expiry_time = undefined;
  await user.save({ new: true, validateModifiedOnly: true });
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessoptions)
    .cookie("refreshToken", refreshToken, refreshoptions)
    .json({
      status: "success",
      user: user,
      message: "OTP verified and  signup successfull",
    });
};

// login
const loginUser = async (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err); // Pass errors to the error handler
    }

    if (!user) {
      return res.status(401).json({
        message: "email or password is incorrect",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err); // Handle error during the login process
      }
      res.cookie("connect.sid", req.sessionID).status(200).json({
        status: "success",
        user: user,
        message: "User logged in Successfully",
      });
    });
  })(req, res, next); // Pass req, res, and next to the authenticate function
};

const loginSuccess = async (req, res) => {
  const user = req.user;

  if (user) {
    res.status(200).json({
      status: "success",
      user: user,
      message: "User logged in Successfully",
    });
  }
};

// forgotpassword
const forgotpassword = async (req, res, next) => {
  // get users email
  const { email } = req.body;
  const isvalidemailformat = email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  if (!isvalidemailformat) {
    return res.status(404).json({
      status: "error",
      message: "Invalid email address",
    });
  }
  const user = await User.findOne({ email: email });

  if (!user) {
    // res No User found with this Email
    return res.status(404).json({
      status: "error",
      message: "There is no user with email address.",
    });
  }
  try {
    // Generate the random reset Token hash it and set it in the DB and also set the Reset token expiry time for 10 min
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `https://byte-messenger.vercel.app/reset-password?token=${resetToken}`;
    console.log(resetToken, "resetToken");
    // send the resetURL to the email
    await sendMail({
      to: user.email,
      subject: "Password Reset 🔑",
      html: ResetPassord(user.userName, resetURL),
      attachments: [],
    });
    // res Reset Password Link sent to Email
    res.status(200).json({
      status: "success",
      message: "Password Reset URL is sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // res Error occured While Sending the Email
    res.status(500).json({
      message: "There was an error sending the email. Try again later!",
    });
  }
};

// resetpassword
const resetpassword = async (req, res, next) => {
  // Get the token from the url using query
  // console.log(req.query)
  const { token } = req.query;
  console.log(token);
  const { NewPassword, confirmNewPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // find the user who has this hashedToken

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token expires or submission is out of Time
  if (!user) {
    // res Token is Invalid or Expired
    return res.status(400).json({
      status: "error",
      message: "Token is Invalid or Expired",
    });
  }

  // update users paswword and set resetToken & expiry to undefined

  user.password = NewPassword;
  user.confirmPassword = confirmNewPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // res

  res.status(200).json({
    status: "success",
    message: "Password Reseted Successfully",
    token,
  });
};

const logout = async (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      status: "success",
      message: "User logout Successfully",
    });
  });
};

const googleLogin = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      return res.redirect("https://byte-messenger.vercel.app/login");
    }

    req.login(user, (err) => {
      if (err) {
        return res.redirect("https://byte-messenger.vercel.app/login");
      }

      // Redirect to your frontend with a success query param
      return res.redirect("https://byte-messenger.vercel.app");
    });
  })(req, res, next); // Call the passport function with req, res, and next
};

const loginFailed = (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
};

export {
  RegisterUser,
  loginUser,
  forgotpassword,
  resetpassword,
  sendOTP,
  verifyOTP,
  logout,
  googleLogin,
  loginSuccess,
  loginFailed,
};
