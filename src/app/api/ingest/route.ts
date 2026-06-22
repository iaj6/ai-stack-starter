import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { ingestDocument } from "@/lib/rag/ingest";
import type { DocType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/ingest { recordId, type, title, text } → index an uploaded document.
 *  `type` is a free-form document-category key (the domain defines its own set). */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    recordId?: string;
    type?: DocType;
    title?: string;
    text?: string;
  };
  const { recordId, type, title, text } = body;
  if (!recordId || !type || !title || !text?.trim()) {
    return NextResponse.json({ error: "recordId, type, title, text required" }, { status: 400 });
  }
  const record = await store().getRecord(recordId);
  if (!record) return NextResponse.json({ error: "record not found" }, { status: 404 });

  const docId = `${recordId}__upload_${Date.now()}`;
  const chunks = await ingestDocument({ recordId, docId, type, title, text });
  return NextResponse.json({ ok: true, docId, chunks });
}
