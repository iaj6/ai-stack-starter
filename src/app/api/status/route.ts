import { NextResponse } from "next/server";
import { systemStatus } from "@/lib/config";
import { store } from "@/lib/db/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: systemStatus(), vectorStore: store().kind() });
}
