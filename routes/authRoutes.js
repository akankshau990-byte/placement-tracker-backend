const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, updatePassword);

module.exports = router;