const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile & Password routes (Authenticated)
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, updatePassword);

module.exports = router;