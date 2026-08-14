import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// ============================================================
// Neon serverless DB connection (singleton).
// Uses the DATABASE_URL from .env (Neon pooled connection string).
// In a Next.js server context this module is cached so the
// connection is reused across requests.
// ============================================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't throw at import time so that `next build` and the
  // static export still succeed in environments where the DB is
  // intentionally absent. Runtime auth calls surface the error.
  console.warn(
    "[lib/db] DATABASE_URL is not set — authentication APIs will not work."
  );
}

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to your .env to enable login."
    );
  }
  _sql = neon(connectionString);
  return _sql;
}