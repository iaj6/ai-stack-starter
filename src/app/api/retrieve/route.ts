import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/rag/ingest";
import { embed } from "@/lib/rag/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/retrieve?recordId=...&q=...&k=5 → ranked chunks, no LLM.
 *
 * Exposes the retriever in isolation so it can be evaluated (and debugged)
 * separately from the generator — see evals/retrieval.ts. An answer the
 * model never saw the source for is a retrieval failure, not a model failure.
 */
export async function GET(req: NextRequest) {
  const recordId = req.nextUrl.searchParams.get("recordId");
  const q = req.nextUrl.searchParams.get("q");
  const k = Math.max(1, Math.min(20, Number(req.nextUrl.searchParams.get("k") ?? 5)));
  if (!recordId || !q) {
    return NextResponse.json({ error: "recordId and q required" }, { status: 400 });
  }
  await ensureSeeded();
  const [queryEmbedding] = await embed([q], "query");
  const hits = await store().search(recordId, queryEmbedding, k);
  return NextResponse.json({
    hits: hits.map((h) => ({
      docId: h.docId,
      docType: h.docType,
      docTitle: h.docTitle,
      ordinal: h.ordinal,
      score: h.score,
      text: h.text,
    })),
  });
}
