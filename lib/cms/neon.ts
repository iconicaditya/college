import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// ============================================================
// Neon CMS — server-only data layer for the shared modules.
//
// When DATABASE_URL is configured, the shared modules are
// persisted to Neon Postgres instead of the GitHub CMS. The
// superadmin-exclusive config (navbar, hero, theme, etc.) ALWAYS
// stays on GitHub / local.
// ============================================================

// Shared modules that migrate to Neon when configured.
export const SHARED_MODULE_KEYS = [
  "events",
  "testimonials",
  "gallery",
  "facilities",
  "contact",
  "footer",
  "documents",
  "enquiries",
] as const;

export type SharedModuleKey = (typeof SHARED_MODULE_KEYS)[number];

/** True when Neon is configured (connection string present). */
export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  _sql = neon(url);
  return _sql;
}

// ---------- Schema bootstrap (idempotent) ----------

async function ensureSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS cms_sections (
      key        TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS cms_sections_updated_at_idx
    ON cms_sections (updated_at DESC)
  `;
}

// ---------- Read ----------

export async function getSectionFromNeon<K extends SharedModuleKey>(
  key: K
): Promise<unknown | null> {
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT data FROM cms_sections WHERE key = ${key}`;
    if (!rows.length) return null;
    return (rows[0] as { data: unknown }).data;
  } catch {
    return null;
  }
}

export async function getSharedModulesFromNeon(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const key of SHARED_MODULE_KEYS) {
    const data = await getSectionFromNeon(key);
    if (data !== null) out[key] = data;
  }
  return out;
}

// ---------- Write ----------

export async function saveSharedModulesToNeon(
  sections: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureSchema();
    const sql = getSql();
    for (const [key, data] of Object.entries(sections)) {
      if (!SHARED_MODULE_KEYS.includes(key as SharedModuleKey)) continue;
      await sql`
        INSERT INTO cms_sections (key, data, updated_at)
        VALUES (${key}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Neon save failed" };
  }
}

// ---------- Delete ----------

export async function deleteSectionFromNeon(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM cms_sections WHERE key = ${key}`;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Neon delete failed" };
  }
}