/**
 * Client-side helper to convert a stored media URL into something the
 * browser can fetch on every deployment target.
 *
 * - Absolute URLs (`https://...`) pass through unchanged.
 * - Data URLs (`data:image/png;base64,...`) pass through unchanged.
 * - Local `/uploads/...` paths are returned unchanged. They are served
 *   natively by Next.js / Vercel as static files because the CMS
 *   commits uploaded images directly into `public/uploads/`.
 * - Empty / null values return an empty string.
 */
export function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:/i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
}
