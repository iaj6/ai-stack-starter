import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/rag/ingest";
import { runAgent } from "@/lib/orchestrator";
import { inputGate, outputGate } from "@/lib/guardrails";
import { addUsage } from "@/lib/ai/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/chat?recordId=... → conversation history + record memory. */
export async function GET(req: NextRequest) {
  const recordId = req.nextUrl.searchParams.get("recordId");
  if (!recordId) return NextResponse.json({ error: "recordId required" }, { status: 400 });
  const s = store();
  const [messages, memories] = await Promise.all([s.getMessages(recordId), s.getMemories(recordId)]);
  return NextResponse.json({ messages, memories });
}

/** POST /api/chat { recordId, message } → guarded, orchestrated answer. */
export async function POST(req: NextRequest) {
  const { recordId, message } = (await req.json()) as { recordId?: string; message?: string };
  if (!recordId || !message?.trim()) {
    return NextResponse.json({ error: "recordId and message required" }, { status: 400 });
  }

  await ensureSeeded();
  const s = store();
  const record = await s.getRecord(recordId);
  if (!record) return NextResponse.json({ error: "record not found" }, { status: 404 });

  // 1. Input guardrail.
  const gate = await inputGate(message);
  if (!gate.allowed) {
    const refusal =
      "I can only help with in-scope questions about this record and its documents. That request was outside scope (or attempted to override my instructions), so I didn't process it.";
    await s.appendMessage(recordId, { role: "user", content: message });
    await s.appendMessage(recordId, { role: "assistant", content: refusal });
    return NextResponse.json({
      answer: refusal,
      citations: [],
      steps: [],
      blocked: true,
      guardrails: { input: gate.checks, output: [] },
      usage: gate.usage,
      model: "guardrail",
    });
  }

  // 2. Orchestrated agent loop (history = prior conversation memory).
  const history = await s.getMessages(recordId);
  const result = await runAgent({ record, message, history });

  // 3. Output guardrail.
  const out = outputGate(result.answer, result.citations);

  // 4. Persist to conversation memory.
  await s.appendMessage(recordId, { role: "user", content: message });
  await s.appendMessage(recordId, {
    role: "assistant",
    content: out.answer,
    citations: result.citations,
  });

  return NextResponse.json({
    answer: out.answer,
    citations: result.citations,
    steps: result.steps,
    blocked: false,
    guardrails: { input: gate.checks, output: out.checks },
    usage: addUsage(result.usage, gate.usage),
    model: result.model,
  });
}
