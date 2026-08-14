// ============================================================
// DataService — Adapter / Repository Pattern.
//
// Central fallback logic for the CMS:
//
//   if (hasNeonAndCloudinaryEnv) { useNeonAndCloudinary() }
//   else { useGitHubCMS() }
//
// The shared modules (events, testimonials, gallery, facilities,
// contact, footer, documents, enquiries) use Neon + Cloudinary when
// configured, otherwise they fall back to the GitHub CMS / local.
//
// Superadmin-exclusive config (navbar, hero, stats, about, programs,
// faculty, admissions, tab-bar, site-settings, access-control) ALWAYS
// stays on GitHub / local — never migrated.
// ============================================================

import {
  isNeonConfigured,
  getSharedModulesFromNeon,
  saveSharedModulesToNeon,
  SHARED_MODULE_KEYS,
} from "./neon";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  CLOUDINARY_SECTIONS,
} from "./cloudinary";
import {
  isGitHubConfigured,
  getSectionFromGitHub,
  saveSectionToGitHub,
  uploadToGitHub,
  deleteFromGitHub,
} from "./github";
import {
  getSectionFromLocal,
  saveSectionToLocal,
  uploadToLocal,
  deleteFromLocal,
} from "./local";

// ---------- Provider detection ----------

/** True when the external backend (Neon + Cloudinary) is fully configured. */
export function hasExternalBackend(): boolean {
  return isNeonConfigured() && isCloudinaryConfigured();
}

/** True when the GitHub CMS is configured (fallback). */
export function hasGitHubBackend(): boolean {
  return isGitHubConfigured();
}

/** The active provider for shared modules. */
export function getActiveProvider(): "neon" | "github" | "local" {
  if (hasExternalBackend()) return "neon";
  if (hasGitHubBackend()) return "github";
  return "local";
}

// ---------- Read ----------

/**
 * Load a single section's content.
 * Shared modules come from Neon when configured, otherwise GitHub/local.
 * Superadmin config always comes from GitHub/local.
 */
export async function loadSection(
  key: string,
  fallback: unknown
): Promise<unknown> {
  const isShared = SHARED_MODULE_KEYS.includes(
    key as (typeof SHARED_MODULE_KEYS)[number]
  );

  // Shared module + Neon configured → Neon.
  if (isShared && isNeonConfigured()) {
    const data = await getSharedModulesFromNeon();
    if (data[key] !== undefined) return data[key];
  }

  // Fallback: GitHub (if configured) else local.
  if (isGitHubConfigured()) {
    return getSectionFromGitHub(key, fallback);
  }
  return getSectionFromLocal(key, fallback);
}

// ---------- Write ----------

/**
 * Persist a single section's content.
 * Shared modules → Neon when configured, otherwise GitHub/local.
 * Superadmin config → GitHub/local ALWAYS.
 */
export async function saveSection(
  key: string,
  data: unknown
): Promise<{ ok: boolean; error?: string }> {
  const isShared = SHARED_MODULE_KEYS.includes(
    key as (typeof SHARED_MODULE_KEYS)[number]
  );

  // Shared module + Neon configured → Neon.
  if (isShared && isNeonConfigured()) {
    const result = await saveSharedModulesToNeon({ [key]: data });
    if (!result.ok) return result;
    return { ok: true };
  }

  // Fallback: GitHub (if configured) else local.
  if (isGitHubConfigured()) {
    return saveSectionToGitHub(key, data);
  }
  return saveSectionToLocal(key, data);
}

// ---------- Media ----------

/**
 * Upload a file to the active media provider.
 * Shared module sections → Cloudinary when configured, otherwise GitHub/local.
 * Superadmin-exclusive sections → GitHub/local ALWAYS.
 */
export async function uploadCmsFile(
  base64: string,
  fileName: string,
  section: string,
  oldUrl?: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const isSharedSection = CLOUDINARY_SECTIONS.includes(
    section as (typeof CLOUDINARY_SECTIONS)[number]
  );

  // Shared module + Cloudinary configured → Cloudinary.
  if (isSharedSection && isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(base64, fileName, section);
    if (result.ok && oldUrl) {
      // Best-effort cleanup of the old Cloudinary asset.
      await deleteFromCloudinary(oldUrl);
    }
    return result;
  }

  // Fallback: GitHub/local (existing behavior).
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const extMatch = cleaned.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0] : "";
  const name = cleaned.replace(ext, "");
  const timestamp = Date.now();
  const safeName = `${name}-${timestamp}${ext || ".png"}`;
  const relPath = `uploads/${section}/${safeName}`;

  if (isGitHubConfigured()) {
    const result = await uploadToGitHub(`public/${relPath}`, base64);
    if (result.ok && oldUrl && oldUrl.startsWith("/uploads/")) {
      const oldRel = oldUrl.replace(/^\//, "");
      const oldSection = oldRel.split("/")[1] || "";
      if (oldSection === section) {
        await deleteFromGitHub(`public/${oldRel}`);
      }
    }
    return result;
  }

  const result = await uploadToLocal(relPath, base64);
  if (result.ok && oldUrl && oldUrl.startsWith("/uploads/")) {
    const oldRel = oldUrl.replace(/^\//, "");
    const oldSection = oldRel.split("/")[1] || "";
    if (oldSection === section) {
      await deleteFromLocal(oldRel);
    }
  }
  return result;
}

/**
 * Delete a previously-uploaded asset.
 * Routes to Cloudinary for shared sections (when configured), otherwise GitHub/local.
 */
export async function deleteCmsFile(
  url: string
): Promise<{ ok: boolean; error?: string }> {
  // Cloudinary URLs are always deleted via Cloudinary.
  if (url.includes("res.cloudinary.com")) {
    return deleteFromCloudinary(url);
  }

  // Local /uploads/ URLs → GitHub or local filesystem.
  if (url.startsWith("/uploads/")) {
    const rel = url.replace(/^\//, "");
    if (isGitHubConfigured()) {
      return deleteFromGitHub(`public/${rel}`);
    }
    return deleteFromLocal(rel);
  }

  return { ok: true };
}