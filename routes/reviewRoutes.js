const express = require("express");
const router = express.Router();
const {
  createReview,
  resetReview,
  getReviews,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReview);
router.post("/reset", protect, resetReview);
router.get("/", protect, getReviews);

module.exports = router;
