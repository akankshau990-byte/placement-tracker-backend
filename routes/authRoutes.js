const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
  updateAvatar,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Public Auth Endpoints
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected Auth Endpoints
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, updatePassword);
router.put("/update-avatar", verifyToken, updateAvatar);

module.exports = router;