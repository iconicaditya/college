import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadFile, isGithubCmsConfigured } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

/**
 * Max upload size. 25 MB keeps us well under GitHub's 100 MB file
 * limit and Vercel's 4.5 MB serverless body limit (local dev has no
 * such cap so this only matters on the deployed route). The route
 * short-circuits earlier on Vercel.
 */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "misc";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const f = file as File;
    if (!ALLOWED_TYPES.has(f.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${f.type}` },
        { status: 400 }
      );
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, "") || "misc";
    const ext = EXT_BY_TYPE[f.type] || "bin";
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await f.arrayBuffer());

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `Image is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB). Use an external image URL for large files.`,
        },
        { status: 413 }
      );
    }

    if (process.env.VERCEL && !isGithubCmsConfigured()) {
      return NextResponse.json(
        {
          error:
            "GitHub-as-CMS is not configured. Set CMS_GITHUB_TOKEN and CMS_GITHUB_REPO in the Vercel env vars so uploads can commit to the repo.",
        },
        { status: 503 }
      );
    }

    const result = await uploadFile(safeFolder, filename, buffer, f.type);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    return NextResponse.json({
      url: result.url,
      mode: result.mode,
      size: buffer.byteLength,
      mime: f.type,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
