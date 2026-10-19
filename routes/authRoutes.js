const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
  updateAvatar,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, updatePassword);
router.put("/update-avatar", verifyToken, updateAvatar);
module.exports = router;