const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Register logic
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully!",
      user: newUser,
    });
  } catch (error) {
    console.log("Registration Error: ", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Login logic
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    // Explicitly set userId in token
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login Successful",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get Current User Profile (Bulletproof Extraction)
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error fetching profile details" });
  }
};

// Update Password
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

// Update Profile Picture / Avatar
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

// module.exports mein updateAvatar add karna mat bhoolna
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
  updateAvatar,
};
