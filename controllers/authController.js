// controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");

// 1. Forgot Password Handler
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Is email se koi account nahi mila!" });
    }

    // 6-digit OTP Generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 Min Expiry
    await user.save();

    // Response (For Testing / Console)
    res.status(200).json({
      message: `OTP sent successfully! (Testing OTP: ${otp})`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during forgot password" });
  }
};

// 2. Reset Password Handler
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid ya Expired OTP!" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful! Login karein." });
  } catch (error) {
    res.status(500).json({ message: "Server error resetting password" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
  updateAvatar,
  forgotPassword,
  resetPassword,
};