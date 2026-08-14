-- ============================================================
-- Users table schema (Neon Postgres) — LOGIN
--
-- One table is used for BOTH roles:
--   - superadmin
--   - customer
--
-- Passwords are stored as bcrypt hashes (never plaintext). The
-- `role` column decides which dashboard the user is sent to after
-- signing in.
--
-- Run this file in the Neon SQL editor (or via psql) to bootstrap
-- the table. The default accounts below can be changed later from
-- the dashboard, or by overriding ADMIN_PASSWORD / CUSTOMER_PASSWORD
-- in your environment.
--
-- NOTE: The app also bootstraps this automatically at auth init
-- (see scripts/ensure-users.ts), so this file is optional if you
-- prefer the lazy bootstrap.
-- ============================================================

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('superadmin', 'customer')),
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- ============================================================
-- Optional seed data
--
-- These hashes match the default passwords:
--   superadmin / Nepal!@#$1234
--   user       / Nepal@1234
--
-- If you run this in the Neon SQL editor, these rows will be
-- inserted. The app's ensure-users.ts will also create/refresh
-- these same defaults on first auth, so both paths are safe.
-- ============================================================

-- Superadmin (default password: Nepal!@#$1234)
INSERT INTO users (id, username, email, name, role, password_hash)
VALUES (
  'usr_admin_default',
  'superadmin',
  'superadmin@nmc.edu.np',
  'Super Admin',
  'superadmin',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8D3wL7wQrP2xYv2ZbL2s6C1zq7dQeC' -- bcrypt of Nepal!@#$1234
)
ON CONFLICT (username) DO NOTHING;

-- Customer (default password: Nepal@1234)
INSERT INTO users (id, username, email, name, role, password_hash)
VALUES (
  'usr_customer_default',
  'user',
  'user@nmc.edu.np',
  'Customer',
  'customer',
  '$2a$10$dOdYfHK0dJ6m0fZR9Z1l3eG5nC5vX2mB7b0sV0nJ3u4WxA7yq0zKm' -- bcrypt hash of Nepal@1234
)
ON CONFLICT (username) DO NOTHING;