const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  uploadSubmissionDocument,
} = require("../controllers/submissionController");
const { protect } = require("../middleware/authMiddleware");

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Error: File upload only supports the following filetypes - " +
          filetypes,
      ),
    );
  },
});

router.route("/").post(protect, createSubmission).get(protect, getSubmissions);

router.route("/:id").get(protect, getSubmissionById);

router
  .route("/:id/documents")
  .post(protect, upload.single("file"), uploadSubmissionDocument);

const { assignReviewers } = require("../controllers/reviewController");
router.post("/:id/assign-reviewers", protect, assignReviewers);

module.exports = router;
