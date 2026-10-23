const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

// Resend API Transporter Configuration
const resend = new Resend(process.env.RESEND_API_KEY);

// 1. REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};

// 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

// 3. GET PROFILE
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// 4. UPDATE PASSWORD
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating password" });
  }
};

// 5. UPDATE AVATAR
const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatar = avatar;
    await user.save();

    res.status(200).json({ message: "Profile picture updated successfully!", user });
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile picture" });
  }
};

// 6. FORGOT PASSWORD (DYNAMIC OTP EMAIL VIA RESEND)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Is email se koi account nahi mila!" });
    }

    // 6-Digit OTP String Generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes Expiry
    await user.save();

    // Send Mail via Resend API
    await resend.emails.send({
      from: "Placement Tracker <onboarding@resend.dev>",
      to: user.email,
      subject: "Password Reset OTP - Placement Tracker",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #007bff;">Placement Tracker</h2>
          <p>Aapka Password Reset OTP hai:</p>
          <h1 style="color: #007bff; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
          <p>Ye OTP agle 10 minutes ke liye valid hai.</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "OTP successfully aapke email par bhej diya gaya hai!",
    });
  } catch (error) {
    console.error("Resend Email Error:", error);
    res.status(500).json({ message: "Email send karne mein issue aaya." });
  }
};

// 7. RESET PASSWORD (STRICT OTP & EXPIRY VERIFICATION)
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordOTP: cleanOtp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid ya Expired OTP! Dubara OTP send karein." });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear Reset Fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful! Ab login karein." });
  } catch (error) {
    console.error("Reset Password Error:", error);
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