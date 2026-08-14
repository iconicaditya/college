import { getSql } from "./db";

// ============================================================
// Users table schema (Neon Postgres).
//
// One table is used for BOTH roles:
//   - superadmin
//   - customer
//
// Passwords are stored as bcrypt hashes (never plaintext). The
// `role` column decides which dashboard the user is sent to after
// signing in.
// ============================================================

export type UserRole = "superadmin" | "customer";

export interface DbUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  created_at: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Look up a user by username (case-insensitive). */
export async function findUserByUsername(
  username: string
): Promise<DbUser | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, username, email, name, role, password_hash, created_at
    FROM users
    WHERE LOWER(username) = LOWER(${username})
    LIMIT 1
  `) as DbUser[];
  return rows[0] ?? null;
}

/** Look up a user by id (used by NextAuth session callback). */
export async function findUserById(id: string): Promise<DbUser | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, username, email, name, role, password_hash, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as DbUser[];
  return rows[0] ?? null;
}

/** Look up a user by role (used by the Access Control page). */
export async function findUserByRole(
  role: UserRole
): Promise<DbUser | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, username, email, name, role, password_hash, created_at
    FROM users
    WHERE role = ${role}
    ORDER BY created_at ASC
    LIMIT 1
  `) as DbUser[];
  return rows[0] ?? null;
}

/** Update a user's username (used by Access Control). */
export async function updateUsername(
  userId: string,
  username: string
): Promise<boolean> {
  const sql = getSql();
  try {
    const rows = (await sql`
      UPDATE users
      SET username = ${username}
      WHERE id = ${userId}
      RETURNING id
    `) as { id: string }[];
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Strip sensitive fields before exposing a user to the client. */
export function toPublicUser(u: DbUser): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    role: u.role,
  };
}