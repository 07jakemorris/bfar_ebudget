-- ============================================================
--  BFAR E-Budget System — Users Table
--  Run AFTER bfar_schema.sql
-- ============================================================

USE bfar_ebudget;

-- ------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)   NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,   -- BCrypt hash (60 chars)
  full_name     VARCHAR(150)  NOT NULL,
  email         VARCHAR(150)  NULL,
  role          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  last_login    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. SEED USERS
--    Passwords below are BCrypt hashes of:
--      admin123  → for Budget Admin
--      staff123  → for Budget Staff
--
--    To generate your own hashes, use the /api/auth/hash-password
--    endpoint (GET /api/auth/hash-password?password=yourpassword)
--    or use the HashPassword utility in AuthHelper.cs
-- ------------------------------------------------------------

INSERT INTO users (username, password_hash, full_name, email, role) VALUES
(
  'budget_admin',
  '$2a$11$KzQv5Y9X8mN3pL7wR2tHOeD6jF4sA1cB0nM9qE5rT8uV3xW6yI2oK',
  'Budget Administrator',
  'admin@bfar.gov.ph',
  'admin'
),
(
  'budget_staff',
  '$2a$11$PmN4qR7sT2uV5wX8yA1bC3dE6fG9hI0jK2lM4nO6pQ8rS0tU2vW4x',
  'Budget Staff',
  'staff@bfar.gov.ph',
  'staff'
);

-- NOTE: The seed hashes above are placeholders.
-- After running this SQL, call the setup endpoint to create
-- real users with proper BCrypt hashes:
--
--   POST /api/auth/setup
--   Body: { "adminPassword": "your_admin_pass", "staffPassword": "your_staff_pass" }
--
-- This will UPDATE the seed rows with real BCrypt hashes.
-- Disable or delete that endpoint after first use!
-- ------------------------------------------------------------
