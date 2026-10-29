const express = require("express");
const router = express.Router();
const {
  getApplications,
  addApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
} = require("../controllers/applicationController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes are protected by authMiddleware
router.use(authMiddleware);

router.get("/", getApplications);
router.post("/", addApplication);
router.put("/:id", updateApplication);
router.patch("/:id/status", updateStatus); // Drag & Drop Status Update Route
router.delete("/:id", deleteApplication);

module.exports = router;