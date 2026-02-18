const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private
const createSubmission = async (req, res) => {
  const {
    skill_area,
    skill_code,
    cluster,
    cohort,
    test_date,
    description,
    document_type,
  } = req.body;

  try {
    const id = uuidv4();
    const submissionId = `RFA-${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1,
    ).padStart(2, "0")}${String(Math.floor(Math.random() * 10000)).padStart(
      5,
      "0",
    )}`;

    // Get user details (instructor) from req.user (added by auth middleware)
    const instructor_id = req.user.id;
    const instructor_email = req.user.email;
    const instructor_name = req.user.full_name || "Unknown Instructor"; // Ideally fetch full name from DB if not in token
    const institution = req.user.institution;

    await pool.query(
      `INSERT INTO submissions (
        id, submission_id, title, skill_area, skill_code, cluster, cohort, test_date, 
        instructor_id, instructor_email, instructor_name, institution, description, 
        document_type, status, workflow_step
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'draft')`,
      [
        id,
        submissionId,
        `${skill_area} - ${cohort}`,
        skill_area,
        skill_code,
        cluster,
        cohort,
        test_date,
        instructor_id,
        instructor_email,
        instructor_name,
        institution,
        description,
        document_type || "internal_moderation",
      ],
    );

    // Return the created submission
    const [rows] = await pool.query("SELECT * FROM submissions WHERE id = ?", [
      id,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all submissions (filtered by role/institution)
// @route   GET /api/submissions
// @access  Private
const getSubmissions = async (req, res) => {
  try {
    const { id, role, institution } = req.user;

    let query = "SELECT * FROM submissions WHERE 1=1";
    const params = [];

    // Role-based filtering logic (Replicating Supabase RLS/Logic)
    if (role === "head_of_programs" || role === "institution_manager") {
      // Can see all submissions for their institution (or all if admin-like, but let's stick to institution)
      // Assuming institution 'Default' or similar for super admins, but logic says:
      if (role !== "head_of_programs") {
        // Logic from route.ts said HoP sees all? Let's check logic.
        // Copied logic: "Head of Programs can see all submissions"
        // Else filter by institution
      }
      if (role !== "head_of_programs") {
        query += " AND institution = ?";
        params.push(institution);
      }
    } else if (role === "instructor") {
      query += " AND instructor_id = ?";
      params.push(id);
    } else if (["senior_instructor", "iam", "manager"].includes(role)) {
      query += " AND current_reviewer_id = ?";
      params.push(id);
    } else {
      // Validation/Records logic... simplifying for now:
      // Filter by institution at minimum
      query += " AND institution = ?";
      params.push(institution);
    }

    query += " ORDER BY updated_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM submissions WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Fetch documents
    const [docs] = await pool.query(
      "SELECT * FROM submission_documents WHERE submission_id = ?",
      [req.params.id],
    );

    const submission = rows[0];
    submission.submission_documents = docs;

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Upload document for submission
// @route   POST /api/submissions/:id/documents
// @access  Private
const uploadSubmissionDocument = async (req, res) => {
  // File upload handled by multer middleware in route
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { id } = req.params;
  const { filename, path: filePath, size, mimetype } = req.file;

  try {
    const docId = uuidv4();
    await pool.query(
      `INSERT INTO submission_documents (
                id, submission_id, file_name, file_path, file_size, file_type, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [docId, id, filename, filePath, size, mimetype, req.user.id],
    );

    // Update submission status if needed to 'submitted' or check logic
    // For now just return success
    res.status(201).json({ message: "File uploaded", documentId: docId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  uploadSubmissionDocument,
};
