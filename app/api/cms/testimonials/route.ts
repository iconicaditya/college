import { NextRequest, NextResponse } from "next/server";
import { loadSection, saveSection } from "@/lib/cms/dataService";
import { getTestimonialsContent, type TestimonialsContent } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fallback = await getTestimonialsContent();
    const content = (await loadSection("testimonials", fallback)) as TestimonialsContent;
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load testimonials content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { content?: TestimonialsContent };
    if (!body?.content) {
      return NextResponse.json({ error: "Missing content payload" }, { status: 400 });
    }
    const result = await saveSection("testimonials", body.content);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ content: body.content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save testimonials content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}