import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadCmsFile } from "@/lib/cms/dataService";

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
 * such cap so this only matters on the deployed route).
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

    // Route through the dataService adapter: shared sections → Cloudinary
    // (when configured), otherwise GitHub/local.
    const result = await uploadCmsFile(
      buffer.toString("base64"),
      filename,
      safeFolder
    );
    if (!result.ok || !result.url) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      url: result.url,
      size: buffer.byteLength,
      mime: f.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed", detail: (error as Error).message },
      { status: 500 }
    );
  }
}