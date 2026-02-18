const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// POST /api/submissions/:id/assign-reviewers
exports.assignReviewers = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  // Only PC or higher can assign
  if (
    role !== "pc" &&
    role !== "institution_manager" &&
    role !== "head_of_programs"
  ) {
    return res
      .status(403)
      .json({ error: "Not authorized to assign reviewers" });
  }

  try {
    // Logic to assign reviewers could be complex (e.g., finding available LE/SE).
    // For now, we'll just set the status to 'le_review' to move the workflow forward.
    // In a real app, you might insert into a `review_assignments` table.

    await pool.query(
      "UPDATE submissions SET status = ?, current_reviewer_id = NULL WHERE id = ?",
      ["le_review", id],
    );

    res.json({
      message: "Reviewers assigned and workflow advanced to LE Review",
    });
  } catch (error) {
    console.error("Assign reviewers error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/reviews
exports.createReview = async (req, res) => {
  const { submission_id, reviewer_role, status, comments } = req.body;
  const reviewer_id = req.user.id;

  if (!submission_id || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const id = uuidv4();

    // Insert review
    await pool.query(
      "INSERT INTO reviews (id, submission_id, reviewer_id, reviewer_role, status, comments) VALUES (?, ?, ?, ?, ?, ?)",
      [id, submission_id, reviewer_id, reviewer_role, status, comments],
    );

    // Update submission status based on review decision
    // This is a simplified state machine.
    let newStatus = status === "approved" ? "approved" : "rejected";

    // Example: If LE approves, move to SE? Or if PC approves?
    // This logic mimics the frontend state machine expectations to some extent.
    // We probably need to fetch current status to know where to go next.

    // Simple logic for now:
    if (
      status === "no_corrections_required" &&
      reviewer_role === "language_expert"
    ) {
      newStatus = "se_review";
    } else if (
      status === "no_corrections_required" &&
      reviewer_role === "subject_expert"
    ) {
      newStatus = "si_review";
    } else if (status === "approved" && reviewer_role === "senior_instructor") {
      newStatus = "pc_review";
    } else if (status === "approved" && reviewer_role === "pc") {
      newStatus = "amo_review";
    } else if (status === "approved" && reviewer_role === "amo") {
      newStatus = "approved";
    } else if (status === "corrections_required" || status === "rejected") {
      newStatus = "corrections_requested";
    }

    await pool.query("UPDATE submissions SET status = ? WHERE id = ?", [
      newStatus,
      submission_id,
    ]);

    res.status(201).json({ message: "Review submitted", reviewId: id });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/reviews/reset
exports.resetReview = async (req, res) => {
  const { submission_id } = req.body;

  try {
    // Reset reviews for this submission? Or just status?
    // The frontend calls this on resubmit.
    // We might want to archive old reviews or just leave them.

    await pool.query(
      "UPDATE submissions SET status = 'submitted' WHERE id = ?",
      [submission_id],
    );
    res.json({ message: "Submission reset" });
  } catch (error) {
    console.error("Reset review error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/reviews
exports.getReviews = async (req, res) => {
  const { submission_id, submission_ids } = req.query;

  try {
    let query = "SELECT * FROM reviews WHERE 1=1";
    const params = [];

    if (submission_id) {
      query += " AND submission_id = ?";
      params.push(submission_id);
    } else if (submission_ids) {
      // submission_ids is comma separated string
      const ids = submission_ids.split(",");
      query += ` AND submission_id IN (${ids.map(() => "?").join(",")})`;
      params.push(...ids);
    }

    const [reviews] = await pool.query(query, params);
    res.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
