import { NextRequest, NextResponse } from "next/server";
import { getDocuments, saveDocuments, type CustomerDocument } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getDocuments();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load documents", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: "add" | "delete"; document?: CustomerDocument };
    if (!body?.action || !body?.document) {
      return NextResponse.json({ error: "Missing action or document payload" }, { status: 400 });
    }
    const current = await getDocuments();
    let updated;
    if (body.action === "add") {
      updated = { documents: [...current.documents, body.document] };
    } else {
      updated = { documents: current.documents.filter((d) => d.id !== body.document!.id) };
    }
    const result = await saveDocuments(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ content: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update documents", detail: (error as Error).message },
      { status: 500 }
    );
  }
}