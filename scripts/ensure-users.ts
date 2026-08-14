import { getSql } from "../lib/db";
import bcrypt from "bcryptjs";

// ============================================================
// Default account credentials used to seed / refresh the
// `users` table on first run. Overridden by the
// ADMIN_PASSWORD / CUSTOMER_PASSWORD env vars if set.
// ============================================================
export const DEFAULT_SUPERADMIN = {
  id: "usr_admin_default",
  username: "superadmin",
  email: "superadmin@nmc.edu.np",
  name: "Super Admin",
  role: "superadmin" as const,
  password: "Nepal!@#$1234",
};

export const DEFAULT_CUSTOMER = {
  id: "usr_customer_default",
  username: "user",
  email: "user@nmc.edu.np",
  name: "Customer",
  role: "customer" as const,
  password: "Nepal@1234",
};

/**
 * Idempotent bootstrap for the users table.
 * - Creates the `users` table if it doesn't exist.
 * - Inserts the default superadmin + customer accounts if missing.
 * - On every run, refreshes the default accounts' usernames +
 *   passwords so the env-supplied / hard-coded defaults always
 *   match what the user typed in the login form.
 *
 * Safe to call multiple times. Used at NextAuth init time so a
 * fresh Neon DB "just works" without any manual SQL step.
 */
export async function ensureUsersSchema(): Promise<void> {
  const sql = getSql();

  // 1. Create table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('superadmin', 'customer')),
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users (LOWER(username))`;
  await sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)`;

  // 2. Seed / refresh default superadmin
  const superadminPassword =
    process.env.ADMIN_PASSWORD || DEFAULT_SUPERADMIN.password;
  const superadminHash = await bcrypt.hash(superadminPassword, 10);
  const existingSuper = (await sql`
    SELECT id FROM users WHERE LOWER(username) = ${DEFAULT_SUPERADMIN.username.toLowerCase()} LIMIT 1
  `) as { id: string }[];

  if (existingSuper.length === 0) {
    await sql`
      INSERT INTO users (id, username, email, name, role, password_hash)
      VALUES (
        ${DEFAULT_SUPERADMIN.id},
        ${DEFAULT_SUPERADMIN.username},
        ${DEFAULT_SUPERADMIN.email},
        ${DEFAULT_SUPERADMIN.name},
        ${DEFAULT_SUPERADMIN.role},
        ${superadminHash}
      )
    `;
  } else {
    await sql`
      UPDATE users
      SET password_hash = ${superadminHash},
          email = ${DEFAULT_SUPERADMIN.email},
          name = ${DEFAULT_SUPERADMIN.name},
          role = ${DEFAULT_SUPERADMIN.role}
      WHERE LOWER(username) = ${DEFAULT_SUPERADMIN.username.toLowerCase()}
    `;
  }

  // Clean up any legacy "admin" user.
  await sql`DELETE FROM users WHERE LOWER(username) = 'admin'`;

  // 3. Seed / refresh default customer
  const customerPassword =
    process.env.CUSTOMER_PASSWORD || DEFAULT_CUSTOMER.password;
  const customerHash = await bcrypt.hash(customerPassword, 10);
  const existingCustomer = (await sql`
    SELECT id FROM users WHERE LOWER(username) = ${DEFAULT_CUSTOMER.username.toLowerCase()} LIMIT 1
  `) as { id: string }[];

  if (existingCustomer.length === 0) {
    await sql`
      INSERT INTO users (id, username, email, name, role, password_hash)
      VALUES (
        ${DEFAULT_CUSTOMER.id},
        ${DEFAULT_CUSTOMER.username},
        ${DEFAULT_CUSTOMER.email},
        ${DEFAULT_CUSTOMER.name},
        ${DEFAULT_CUSTOMER.role},
        ${customerHash}
      )
    `;
  } else {
    await sql`
      UPDATE users
      SET password_hash = ${customerHash},
          email = ${DEFAULT_CUSTOMER.email},
          name = ${DEFAULT_CUSTOMER.name},
          role = ${DEFAULT_CUSTOMER.role}
      WHERE LOWER(username) = ${DEFAULT_CUSTOMER.username.toLowerCase()}
    `;
  }

  // Clean up any legacy "shreeyash" or "customer" users.
  await sql`DELETE FROM users WHERE LOWER(username) = 'shreeyash'`;
  await sql`DELETE FROM users WHERE LOWER(username) = 'customer'`;
}