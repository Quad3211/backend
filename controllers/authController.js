const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");

// Generate JWT
const generateToken = (id, email, role, institution) => {
  return jwt.sign(
    { id, email, role, institution },
    process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod",
    {
      expiresIn: "30d",
    },
  );
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  const { email, password, full_name, role, institution } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please add all fields" });
  }

  try {
    // Check if user exists
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const id = uuidv4();
    const userRole = role || "instructor";
    const userInstitution = institution || "Default";

    await pool.query(
      "INSERT INTO users (id, email, password_hash, full_name, role, institution, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        email,
        hashedPassword,
        full_name,
        userRole,
        userInstitution,
        "approved",
      ],
    );

    res.status(201).json({
      id,
      email,
      full_name,
      role: userRole,
      institution: userInstitution,
      token: generateToken(id, email, userRole, userInstitution),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // Check password
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        institution: user.institution,
        token: generateToken(user.id, user.email, user.role, user.institution),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, full_name, role, institution FROM users WHERE id = ?",
      [req.user.id],
    );

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
