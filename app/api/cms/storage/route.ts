import { NextResponse } from "next/server";
import { getStorageInfo } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const info = await getStorageInfo();
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read storage info", detail: (error as Error).message },
      { status: 500 }
    );
  }
}