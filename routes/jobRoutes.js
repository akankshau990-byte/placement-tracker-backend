const express = require("express");
const router = express.Router();
const { searchJobsByDomain } = require("../controllers/jobController");
router.get("/search", searchJobsByDomain);

module.exports = router;