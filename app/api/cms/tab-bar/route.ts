import { NextRequest, NextResponse } from "next/server";
import { getTabBarContent, saveTabBarContent, type TabBarContent } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getTabBarContent();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load tab bar content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { content?: TabBarContent };
    if (!body?.content) {
      return NextResponse.json({ error: "Missing content payload" }, { status: 400 });
    }
    // Sanitize: only keep the two known fields.
    const sanitized: TabBarContent = {
      tabName: typeof body.content.tabName === "string" ? body.content.tabName.trim() : "",
      tabLogo: typeof body.content.tabLogo === "string" ? body.content.tabLogo.trim() : "",
    };
    const result = await saveTabBarContent(sanitized);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      content: sanitized,
      commitSha: result.commitSha,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save tab bar content", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
