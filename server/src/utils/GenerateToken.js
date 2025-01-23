import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
const refreshAccessToken = async (req, res) => {
  const incomingrefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingrefreshToken) {
    return res.status(401).json({
      status: "error",
      message: "Unathorized request",
    });
  }
  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id).select(
      "_id userName refreshToken"
    );
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh Token",
      });
    }

    if (incomingrefreshToken !== user.refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh Token is Expired",
      });
    }
    const options = {
      httpOnly: true,
      // secure: true,
    };

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken; // updating the newrefreshToken into the database to compare next
    await user.save({ validateBeforeSave: false });
    req.user = user;

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        status: "success",
        message: "Access Token refreshed",
      });
  } catch (error) {}
};

export { refreshAccessToken };
