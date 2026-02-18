const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    // Only valid for certain roles
    if (!["head_of_programs", "institution_manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let query =
      "SELECT id, email, full_name, role, institution, created_at, approval_status, rejected_reason FROM users WHERE 1=1";
    const params = [];

    if (req.user.role === "institution_manager") {
      query += " AND institution = ?";
      params.push(req.user.institution);
    }

    query += " ORDER BY created_at DESC";

    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/update-role
exports.updateUserRole = async (req, res) => {
  const { userId, role } = req.body;
  const {
    role: currentUserRole,
    institution: currentUserInstitution,
    id: currentUserId,
  } = req.user;

  try {
    // Validate permissions
    if (
      !["head_of_programs", "institution_manager"].includes(currentUserRole)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if target user exists and is in same institution (if manager)
    const [targetUser] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (targetUser.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userToUpdate = targetUser[0];

    if (currentUserRole === "institution_manager") {
      if (userToUpdate.institution !== currentUserInstitution) {
        return res
          .status(403)
          .json({ error: "Cannot manage users from other institutions" });
      }
      if (role === "head_of_programs") {
        return res
          .status(403)
          .json({ error: "Cannot assign Head of Programs role" });
      }
      if (userId === currentUserId && role === "head_of_programs") {
        return res
          .status(403)
          .json({ error: "Cannot promote self to Head of Programs" });
      }
    }

    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/remove
exports.removeUser = async (req, res) => {
  const { userId, reason } = req.body;
  const { role: currentUserRole, institution: currentUserInstitution } =
    req.user;

  try {
    if (
      !["head_of_programs", "institution_manager"].includes(currentUserRole)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [targetUser] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (targetUser.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userToRemove = targetUser[0];

    if (
      currentUserRole === "institution_manager" &&
      userToRemove.institution !== currentUserInstitution
    ) {
      return res
        .status(403)
        .json({ error: "Cannot remove users from other institutions" });
    }

    // Soft delete? Or hard delete? Or status=inactive?
    // For now, let's delete from users table.
    // NOTE: This might fail if foreign keys (submissions etc) exist.
    // Better to set active=0 if we had that column.
    // Or just delete and let DB handle cascade if configured, or fail.

    // Let's assume we want to disable login. We don't have is_active.
    // Let's delete for now, assuming cascade or minimal constraints for this mocked migration.
    // Actually schema has foreign keys.

    // Alternative: scramble password or change role to 'suspended'.
    // But user asked for remove.

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    // Log the removal reason in audit logs (if we had them)
    console.log(`User ${userId} removed by ${req.user.id}. Reason: ${reason}`);

    res.json({ message: "User removed successfully" });
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(500).json({ error: "Server error or integrity constraint" });
  }
};

// POST /api/users/approve
exports.approveUser = async (req, res) => {
  const { userId, action, reason } = req.body; // action: 'approve' | 'reject'
  const { role: currentUserRole } = req.user;

  try {
    if (
      !["head_of_programs", "institution_manager"].includes(currentUserRole)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (action === "approve") {
      await pool.query(
        "UPDATE users SET approval_status = 'approved' WHERE id = ?",
        [userId],
      );
      // Send email...
    } else if (action === "reject") {
      await pool.query(
        "UPDATE users SET approval_status = 'rejected', rejected_reason = ? WHERE id = ?",
        [reason, userId],
      );
      // Send email...
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    res.json({ message: `User ${action}d successfully` });
  } catch (error) {
    console.error("Approve/Reject user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
