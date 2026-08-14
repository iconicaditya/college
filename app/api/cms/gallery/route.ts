import { NextRequest, NextResponse } from "next/server";
import { loadSection, saveSection } from "@/lib/cms/dataService";
import { getGalleryContent, type GalleryContent } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fallback = await getGalleryContent();
    const content = (await loadSection("gallery", fallback)) as GalleryContent;
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load gallery content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { content?: GalleryContent };
    if (!body?.content) {
      return NextResponse.json({ error: "Missing content payload" }, { status: 400 });
    }
    const result = await saveSection("gallery", body.content);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ content: body.content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save gallery content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}