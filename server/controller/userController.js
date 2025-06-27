import User from "../models/userModel.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import crypto from "crypto";
// import { sendEmail } from "../utils/sendmail.js";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
};
const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return next(new AppError("All feilds are required", 400));
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("Email already registered", 400));
  }
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://img.freepik.com/premium-vector/asian-men-avatar_7814-345.jpg?semt=ais_hybrid&w=740",
    },
  });
  if (!user) {
    return next(new AppError("User registration failed", 400));
  }

  //TODO:file upload
  if (req.file) {
    console.log(req.file);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        console.log(result);
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        //removing the file with fs
        try {
          await fs.rm(`uploads/${req.file.filename}`);
          console.log("File deleted after upload to cloud");
        } catch (err) {
          console.error("Error deleting local file:", err);
        }
      }
    } catch (e) {
      return next(new AppError("File not uploaded try again! " + e.message));
    }
  }

  await user.save();
  user.password = undefined;

  const token = await user.generateJWTToken();
  res.cookie("token", token, cookieOptions);
  res.status(201).json({
    success: true,
    message: "user registered successfully",
    user,
  });
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("All feilds aer required", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    // console.log(user);
    const isMatch = await user.comparePassword(password);

    if (!user || ! isMatch) {
      return next(new AppError("Email or Password does not match", 400));
    }
    const token = await user.generateJWTToken();
    user.password = undefined;
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "user loggedin successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};
const logout = (req, res) => {
  res.cookie("token", null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "user successfully logged out",
  });
};
const getProfile = async(req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user =await User.findById( userId );
     if (!user) {
    return next(new AppError("User not found", 404));
  }
    console.log(user)
    res.status(200).json({
      success: true,
      message: "user details",
      user,
    });
  } catch (e) {
    return next(new AppError("failed to fetch the user profile", 500));
  }
};

const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  console.log(User.find());
  const user = await User.findOne({ email });
  console.log(user);
  if (!user) {
    return next(new AppError("User not exists", 400));
  }
  const resetToken = await user.generatePasswordResetToken();
  await user.save();
  const resetPasswordURL = `${process.env.FRONEND_URL}/resetPasssword/${resetToken}`;
  try {
    const subject = "Reset Password";
    const message = `you can reset your password by clicking on <a href=${resetPasswordURL} target='_blank'>Reset your password</a> If this not work then paste this like ${resetPasswordURL} in new tab`;
    // await sendEmail(email, subject, message);
    res.status(200).json({
      success: true,
      message: `reset password mail sent to ${email} successfully and url is ${resetPasswordURL}`,
    });
  } catch (e) {
    user.forgetPasswordExpiry = undefined;
    user.forgetPasswordToken = undefined;
    await user.save();
    return next(new AppError(e.message, 500));
  }
};

const resetPassword = async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  const forgetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgetPasswordToken,
    forgetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is Expired Try again later!", 400));
  }
  user.password = password;
  user.forgetPasswordToken = undefined;
  user.forgetPasswordExpiry = undefined;
  user.save();
  res.status(200).json({
    message: "Password changed successfully",
    success: true,
    user,
  });
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;
  if (!oldPassword || !newPassword) {
    return next(new AppError("All feilds are mandatory", 400));
  }
  const user = await user.findOne({ id }).select("+password");
  if (!user) {
    return next(new AppError("User does not exists", 404));
  }
  const isPasswordValid = await user.comparePassword(oldPassword);
  if (!isPasswordValid) {
    return next(new AppError("Invalid old Password", 400));
  }
  user.password = newPassword;
  user.save();
  user.password = undefined;
  res.status(200).json({
    success: true,
    message: "Password Changed successfully",
  });
};
const updateUser = async (req, res, next) => {
  const { fullname } = req.body;
  const { id } = req.user.id;
  const user = await User.findById({ id });
  if (!user) {
    return next(new AppError("User does not exists", 400));
  }
  if (fullname) {
    user.fullName = fulllname;
  }
  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        console.log(result);
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        //removing the file with fs
        try {
          await fs.rm(`uploads/${req.file.filename}`);
          console.log("File deleted after upload to cloud");
        } catch (err) {
          console.error("Error deleting local file:", err);
        }
      }
    } catch (e) {
      return next(new AppError("File not uploaded try again! " + e.message));
    }
  }
  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    uesr,
  });
};

export {
  register,
  login,
  logout,
  getProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  updateUser,
};
