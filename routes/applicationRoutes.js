const express = require("express");
const router = express.Router();
const {
  addApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");
const verifyToken = require("../middleware/authMiddleware");

// Subhi routes par verifyToken middleware lagaya gaya hai
router.post("/", verifyToken, addApplication);
router.get("/", verifyToken, getApplications);
router.put("/:id", verifyToken, updateApplication);
router.delete("/:id", verifyToken, deleteApplication);

module.exports = router;