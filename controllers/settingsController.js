// GET /api/settings/workflow
exports.getWorkflowSettings = async (req, res) => {
  try {
    // Mock settings for now, or fetch from DB if we had a settings table.
    // For migration, we'll return default static settings.
    const settings = {
      review_timeouts_days: 14,
      escalation_email: "support@example.com",
      file_retention_years: 5,
    };
    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
