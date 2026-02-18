const express = require("express");
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  removeUser,
  approveUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getUsers);
router.post("/update-role", protect, updateUserRole);
router.post("/remove", protect, removeUser);
router.post("/approve", protect, approveUser);

module.exports = router;
