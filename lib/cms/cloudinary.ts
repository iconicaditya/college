import crypto from "crypto";

// ============================================================
// Cloudinary CMS — server-only media layer for the shared modules.
//
// When CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
// CLOUDINARY_API_SECRET are configured, image/video/file uploads
// for the shared modules are routed to Cloudinary instead of the
// Git repo. Superadmin-exclusive assets (navbar logo, hero image,
// etc.) ALWAYS stay on GitHub / local.
// ============================================================

// Modules that use Cloudinary when configured.
export const CLOUDINARY_SECTIONS = [
  "events",
  "testimonials",
  "gallery",
  "facilities",
  "contact",
  "footer",
  "documents",
  "enquiries",
] as const;

export type CloudinarySection = (typeof CLOUDINARY_SECTIONS)[number];

/** True when Cloudinary is fully configured. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function getConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  };
}

/** Build the Cloudinary API signature for a given params object. */
function signParams(params: Record<string, string>): string {
  const { apiSecret } = getConfig();
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
}

/**
 * Upload a base64-encoded file to Cloudinary.
 * Returns a public URL (https://res.cloudinary.com/...).
 */
export async function uploadToCloudinary(
  base64: string,
  fileName: string,
  section: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const { cloudName, apiKey } = getConfig();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const publicId = `cms/${section}/${fileName.replace(/\.[^.]+$/, "")}-${timestamp}`;

    const params: Record<string, string> = {
      timestamp,
      public_id: publicId,
      folder: `cms/${section}`,
    };
    const signature = signParams(params);

    const form = new FormData();
    form.append("file", `data:${detectMime(fileName)};base64,${base64}`);
    form.append("public_id", publicId);
    form.append("folder", `cms/${section}`);
    form.append("timestamp", timestamp);
    form.append("api_key", apiKey);
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: form }
    );
    const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
    if (!res.ok || !data.secure_url) {
      return { ok: false, error: data.error?.message || "Cloudinary upload failed" };
    }
    return { ok: true, url: data.secure_url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cloudinary upload failed" };
  }
}

/** Delete an asset from Cloudinary by its public URL. */
export async function deleteFromCloudinary(
  url: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!url.includes("res.cloudinary.com")) return { ok: true };
    const { cloudName, apiKey } = getConfig();
    const match = url.match(/\/v\d+\/(.+?)(?:\.[a-z0-9]+)?$/i);
    if (!match) return { ok: true };
    const publicId = match[1];

    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = { timestamp, public_id: publicId };
    const signature = signParams(params);

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("timestamp", timestamp);
    form.append("api_key", apiKey);
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body: form }
    );
    const data = (await res.json()) as { result?: string };
    if (!res.ok || data.result !== "ok") {
      return { ok: false, error: "Cloudinary delete failed" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cloudinary delete failed" };
  }
}

/** Detect a MIME type from a file extension. */
function detectMime(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    pdf: "application/pdf",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimes[ext] || "application/octet-stream";
}