import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "userName is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: {
        validator: function (email) {
          return String(email)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        },
        // if validation fails
        message: (props) => `Email ${props.value} is invalid`,
      },
    },
    gender: {
      type: String,
      // enum: ["male", "female" ,""],
      // required: [true, "gender is required"],
    },

    password: {
      type: String,
      // required: [true, "Password is required"],
    },
    confirmPassword: {
      type: String,
      // required: [true, "Password is required"],
    },
    about: {
      type: String,
      default: "Hey! Iam using chatapp",
    },
    avatar: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otp_expiry_time: {
      type: Date,
    },
    socket_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Online", "Offline"],
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
); // {timestamps: true} --> give u createdAt , updatedAt fields on doc

// Hash the passowrd
userSchema.pre("save", async function (next) {
  // Run this function in two situations
  // 1) first time the user document is being created (this.isModified('password') will be true)
  // 2) when the password was actually modified (this.isModified('password') will be true)
  if (!this.isModified("password") || !this.password) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Hash the confirmPassword
userSchema.pre("save", async function (next) {
  // Run this function in two situations
  // 1) first time the user document is being created (this.isModified('password') will be true)
  // 2) when the password was actually modified (this.isModified('password') will be true)
  if (!this.isModified("confirmPassword") || !this.confirmPassword)
    return next();

  // Hash the password with cost of 12
  this.confirmPassword = await bcrypt.hash(this.confirmPassword, 12);

  next();
});

// Hash the otp
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("otp") || !this.otp) return next();

  // Hash the otp with cost of 12
  this.otp = await bcrypt.hash(this.otp.toString(), 12);

  console.log(this.otp.toString(), "FROM PRE SAVE HOOK");

  next();
});

// password verification
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//otp verification
userSchema.methods.isOtpCorrect = async function (otp) {
  return await bcrypt.compare(otp, this.otp);
};

//Generate passwordResetToken
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate AccessToken
userSchema.methods.generateAccessToken = function () {
  // return jwt.sign(data,secret,expiry)

  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

// Generate refreshToken
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);
export default User;
