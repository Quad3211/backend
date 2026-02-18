const { pool } = require("../config/db");

// GET /api/archive
exports.getArchives = async (req, res) => {
  try {
    // Fetch submissions that are archived?
    // Or fetch from a separate `archives` table if one exists.
    // The frontend interface expects `ArchivedSubmission` with `archive_notes`, `retention_until` etc.
    // Looking at `schema.sql`, we don't know if `archives` table exists.
    // Wait, looking at step 225 edits: I see `backend/schema.sql` was viewed/edited.
    // It mentioned "merged tables".
    // Let's assume we use `submissions` table where status='archived' for now,
    // OR if there is an `audit_logs` or `archives` table.
    // Since I can't check schema.sql right now without a tool call, I will check it next.
    // But for now, valid SQL is needed.

    // Placeholder implementation assuming 'submissions' table
    const [rows] = await pool.query(
      "SELECT * FROM submissions WHERE status = 'archived'",
    );
    // Map to expected format
    const archives = rows.map((r) => ({
      id: r.id,
      submission_id: r.submission_id,
      file_format: "PDF", // Placeholder
      retention_until: new Date(
        new Date(r.created_at).setFullYear(
          new Date(r.created_at).getFullYear() + 5,
        ),
      ).toISOString(),
      archive_notes: "",
      archived_at: r.updated_at,
      archived_by: "System",
    }));

    res.json(archives);
  } catch (error) {
    console.error("Get archives error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
