import { NextRequest, NextResponse } from "next/server";
import { getProgramsDetailContent, saveProgramsDetailContent, type ProgramsDetailContent, type ProgramDetail } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getProgramsDetailContent();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load programs detail", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: string; program?: ProgramDetail };
    if (!body?.action || !body?.program) {
      return NextResponse.json({ error: "Missing action or program payload" }, { status: 400 });
    }

    const current = await getProgramsDetailContent();
    let updated: ProgramsDetailContent;

    switch (body.action) {
      case "add": {
        updated = {
          ...current,
          programs: [...current.programs, body.program],
        };
        break;
      }
      case "edit": {
        updated = {
          ...current,
          programs: current.programs.map((p) =>
            p.id === body.program!.id ? body.program! : p
          ),
        };
        break;
      }
      case "delete": {
        updated = {
          ...current,
          programs: current.programs.filter((p) => p.id !== body.program!.id),
        };
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    }

    const result = await saveProgramsDetailContent(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      content: updated,
      commitSha: result.commitSha,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process programs detail", detail: (error as Error).message },
      { status: 500 }
    );
  }
}