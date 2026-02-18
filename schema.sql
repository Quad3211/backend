-- Database Schema for Submissions Platform (MySQL)

SET FOREIGN_KEY_CHECKS = 0;

-- Users Table (Merged Supabase auth.users + public.profiles)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'instructor', -- instructor, senior_instructor, head_of_programs, pc, amo, records, institution_manager, admin
    institution VARCHAR(255),
    approval_status VARCHAR(50) DEFAULT 'approved', -- approved, pending, rejected
    approved_by CHAR(36),
    approved_at DATETIME,
    rejected_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Submissions Table
DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(50) NOT NULL, -- Human readable ID (e.g. RFA-2024-01001)
    title VARCHAR(255),
    skill_area VARCHAR(255) NOT NULL,
    skill_code VARCHAR(50),
    cluster VARCHAR(50),
    cohort VARCHAR(50) NOT NULL,
    test_date DATE NOT NULL,
    instructor_id CHAR(36) NOT NULL,
    instructor_email VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    description TEXT,
    document_type VARCHAR(50) DEFAULT 'internal_moderation',
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, pc_review, etc.
    workflow_step VARCHAR(50) DEFAULT 'draft',
    current_reviewer_id CHAR(36),
    submitted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Submission Documents Table
DROP TABLE IF EXISTS submission_documents;
CREATE TABLE submission_documents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL, -- Path relative to storage root
    file_size INT,
    file_type VARCHAR(100),
    version INT DEFAULT 1,
    uploaded_by CHAR(36) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews Table
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    reviewer_role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, corrections_requested
    comments TEXT,
    review_type VARCHAR(50) DEFAULT 'primary',
    reviewed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Logs Table
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(255) NOT NULL,
    action_type VARCHAR(100),
    submission_id CHAR(36),
    details JSON,
    reviewer_name VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    submission_id CHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- Insert a default admin user (Password: admin123)
-- Hash generated for 'admin123' using bcrypt (assuming 10 rounds)
-- You might want to remove this or change password in production
-- INSERT INTO users (id, email, password_hash, full_name, role, institution, approval_status)
-- VALUES (UUID(), 'admin@example.com', '$2a$10$wI5z9.X./...hash...', 'Admin User', 'admin', 'Default', 'approved');
