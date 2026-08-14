// ============================================================
// GitHub CMS — server-only data layer.
// Delegates to the existing lib/cms-store.ts GitHub helpers
// (Octokit Contents API) so the dataService adapter can reference
// a consistent provider interface.
// ============================================================

import {
  isGithubCmsConfigured,
  readContent,
  writeContent,
  uploadFile,
} from "@/lib/cms-store";

/** True when GitHub is configured (token + repo set in the environment). */
export function isGitHubConfigured(): boolean {
  return isGithubCmsConfigured();
}

/** Read a section JSON file (data/<key>.json) from GitHub/repo. */
export async function getSectionFromGitHub(
  key: string,
  fallback: unknown
): Promise<unknown> {
  return readContent(key, fallback);
}

/** Write a section JSON file (data/<key>.json) to GitHub/repo. */
export async function saveSectionToGitHub(
  key: string,
  data: unknown
): Promise<{ ok: boolean; error?: string }> {
  const result = await writeContent(key, data as never);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

/** Upload a base64-encoded file to the repo (public/uploads/...). */
export async function uploadToGitHub(
  filePath: string,
  base64: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  // Normalize: filePath like "uploads/section/file.png" (no leading public/)
  const parts = filePath.replace(/^public\//, "").split("/");
  const folder = parts.length > 1 ? parts[0] : "misc";
  const filename = parts[parts.length - 1] || "file.bin";
  const buffer = Buffer.from(base64, "base64");
  // Resolve mime from extension
  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const mimeByExt: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
  };
  const mime = mimeByExt[ext] || "application/octet-stream";
  const result = await uploadFile(folder, filename, buffer, mime);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.url };
}

/** Delete a file from the repo (best-effort no-op in current impl). */
export async function deleteFromGitHub(
  _filePath: string
): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}