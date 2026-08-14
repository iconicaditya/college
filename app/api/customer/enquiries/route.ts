import { NextRequest, NextResponse } from "next/server";
import { getEnquiries, saveEnquiries, type Enquiry } from "@/lib/enquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getEnquiries();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load enquiries", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { enquiry?: Enquiry };
    if (!body?.enquiry) {
      return NextResponse.json({ error: "Missing enquiry payload" }, { status: 400 });
    }
    const current = await getEnquiries();
    const updated = { enquiries: [...current.enquiries, body.enquiry] };
    const result = await saveEnquiries(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ content: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit enquiry", detail: (error as Error).message },
      { status: 500 }
    );
  }
}