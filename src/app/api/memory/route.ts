import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/memory?recordId=... → durable notes for the record. */
export async function GET(req: NextRequest) {
  const recordId = req.nextUrl.searchParams.get("recordId");
  if (!recordId) return NextResponse.json({ error: "recordId required" }, { status: 400 });
  return NextResponse.json({ memories: await store().getMemories(recordId) });
}

/** POST /api/memory { recordId, note } → persist an institutional-memory note. */
export async function POST(req: NextRequest) {
  const { recordId, note } = (await req.json()) as { recordId?: string; note?: string };
  if (!recordId || !note?.trim()) {
    return NextResponse.json({ error: "recordId and note required" }, { status: 400 });
  }
  const mem = await store().addMemory(recordId, note.trim());
  return NextResponse.json({ ok: true, memory: mem });
}
