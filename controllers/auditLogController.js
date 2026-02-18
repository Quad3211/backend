const { pool } = require("../config/db");

// GET /api/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    if (
      !["head_of_programs", "records", "institution_manager"].includes(
        req.user.role,
      )
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [logs] = await pool.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50",
    );
    res.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
