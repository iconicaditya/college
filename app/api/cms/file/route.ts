// Legacy /api/cms/file route removed.
//
// Uploaded media is now stored as real files under `public/uploads/`
// and committed to GitHub via the Contents API. Next.js / Vercel serve
// the `public/` directory as native static files, so the
// `/uploads/<folder>/<file>` path resolves directly in the browser
// without any API indirection.
//
// This route is intentionally empty so any stale link pointing at it
// returns 410 Gone rather than 404.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error: "This route is no longer used.",
      detail:
        "Uploaded media is served natively from /uploads/<filename>. Please update the saved URL in the CMS to remove the /api/cms/file?p= prefix.",
    },
    { status: 410 }
  );
}
