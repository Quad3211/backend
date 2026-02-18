const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

// Callback route (if still needed for legacy support or other auth providers)
router.get("/callback", (req, res) => {
  res.send("Auth callback route");
});

module.exports = router;
