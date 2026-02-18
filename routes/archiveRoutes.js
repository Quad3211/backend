const express = require("express");
const router = express.Router();
const { getArchives } = require("../controllers/archiveController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getArchives);

module.exports = router;
