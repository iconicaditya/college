// ============================================================
// Local CMS — development-only data layer.
// Reads/writes structured JSON directly on the local filesystem
// so local development works seamlessly without any config.
// Delegates to the existing lib/cms-store.ts local helpers.
// ============================================================

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/** Read a section JSON file (data/<key>.json) from the local filesystem. */
export async function getSectionFromLocal(
  key: string,
  fallback: unknown
): Promise<unknown> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${key}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Write a section JSON file (data/<key>.json) to the local filesystem. */
export async function saveSectionToLocal(
  key: string,
  data: unknown
): Promise<{ ok: boolean; error?: string }> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      path.join(DATA_DIR, `${key}.json`),
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Local save failed" };
  }
}

/** Upload a base64-encoded file to the local public/uploads directory. */
export async function uploadToLocal(
  filePath: string,
  base64: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const publicPath = path.join(UPLOADS_DIR, filePath.replace(/^public\//, ""));
    await fs.mkdir(path.dirname(publicPath), { recursive: true });
    await fs.writeFile(publicPath, Buffer.from(base64, "base64"));
    return { ok: true, url: `/${filePath.replace(/^public\//, "")}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Local upload failed" };
  }
}

/** Delete a file from the local public/uploads directory. */
export async function deleteFromLocal(
  filePath: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const publicPath = path.join(UPLOADS_DIR, filePath.replace(/^public\//, ""));
    await fs.unlink(publicPath);
    return { ok: true };
  } catch {
    // File may not exist — treat as success (idempotent delete).
    return { ok: true };
  }
}