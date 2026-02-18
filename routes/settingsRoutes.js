const express = require("express");
const router = express.Router();
const { getWorkflowSettings } = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");

router.get("/workflow", protect, getWorkflowSettings);

module.exports = router;
