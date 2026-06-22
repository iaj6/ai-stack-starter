import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODELS, costOf, addUsage, emptyUsage, isLLMConfigured } from "@/lib/ai/anthropic";
import { DOMAIN } from "@/domain/server";
import { store } from "@/lib/db/store";
import { embedOne } from "@/lib/rag/embeddings";
import type { AgentStep, ChatMessage, Citation, DemoRecord, Usage } from "@/lib/types";

const MAX_TURNS = 6;
const TOP_K = 5;

// Built-in retrieval tool (frozen — every domain gets it). Domain-specific tools
// are merged in from DOMAIN.tools.
const SEARCH_TOOL = {
  name: "search_documents",
  description:
    "Search this record's source documents for relevant passages. Call this before answering any question that depends on the record's specifics (figures, terms, names, dates).",
  input_schema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "What to look for, e.g. 'appraised value' or 'lease term'." },
    },
    required: ["query"],
  },
};

export interface OrchestratorResult {
  answer: string;
  citations: Citation[];
  steps: AgentStep[];
  usage: Usage;
  model: string;
}

/**
 * Multi-step agent: retrieve relevant passages → extract figures → call domain
 * tools → answer. The loop is code-controlled (a manual tool-use loop) so every
 * step is auditable and surfaced to the user.
 */
export async function runAgent(opts: {
  record: DemoRecord;
  message: string;
  history: ChatMessage[];
}): Promise<OrchestratorResult> {
  const { record, message, history } = opts;
  const s = store();

  if (!isLLMConfigured()) {
    return stubAnswer(record, message);
  }

  const memories = await s.getMemories(record.id);
  const system = buildSystem(record, memories.map((m) => m.note));
  const tools = [SEARCH_TOOL, ...DOMAIN.tools.map((t) => t.definition)] as Anthropic.Tool[];

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m): Anthropic.MessageParam => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const steps: AgentStep[] = [];
  const citationMap = new Map<string, Citation>();
  let usage = emptyUsage;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await anthropic().messages.create({
      model: MODELS.brain,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system,
      tools,
      messages,
    });

    usage = addUsage(usage, {
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      costUsd: costOf(MODELS.brain, res.usage.input_tokens, res.usage.output_tokens),
    });

    messages.push({ role: "assistant", content: res.content });

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    if (res.stop_reason !== "tool_use" || toolUses.length === 0) {
      const answer = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      steps.push({ type: "answer", label: "Answer composed" });
      return {
        answer: answer || "I couldn't produce an answer from the source documents.",
        citations: [...citationMap.values()].sort((a, b) => b.score - a.score),
        steps,
        usage,
        model: MODELS.brain,
      };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (tu.name === "search_documents") {
        const query = String((tu.input as { query?: string }).query ?? message);
        steps.push({ type: "tool_call", label: "Search documents", detail: query });
        const qEmb = await embedOne(query, "query");
        const hits = await s.search(record.id, qEmb, TOP_K);
        for (const h of hits) citationMap.set(h.chunkId, bestScore(citationMap.get(h.chunkId), h));
        steps.push({
          type: "tool_result",
          label: `Retrieved ${hits.length} passage(s)`,
          detail: hits.map((h) => h.docTitle).join(", "),
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: hits.length
            ? hits.map((h, i) => `[${i + 1}] ${h.docTitle} (relevance ${(h.score * 100).toFixed(0)}%)\n${h.text}`).join("\n\n")
            : "No matching passages found in this record's documents.",
        });
        continue;
      }

      const tool = DOMAIN.tools.find((t) => t.definition.name === tu.name);
      if (tool) {
        steps.push({ type: "tool_call", label: tu.name, detail: JSON.stringify(tu.input) });
        const r = tool.run(tu.input as Record<string, unknown>);
        steps.push({ type: "tool_result", label: r.label, detail: r.detail });
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: r.content, is_error: r.isError });
      } else {
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: `Unknown tool: ${tu.name}`, is_error: true });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    answer: "I reached the step limit while researching this question. Please narrow it and try again.",
    citations: [...citationMap.values()].sort((a, b) => b.score - a.score),
    steps,
    usage,
    model: MODELS.brain,
  };
}

function buildSystem(record: DemoRecord, notes: string[]): string {
  let s = `${DOMAIN.systemPrompt}\n\nCURRENT RECORD\n- Name: ${record.name}\n- ${record.subtitle}\n- Group: ${record.category}\n- Status: ${record.status}`;
  if (notes.length) {
    s += `\n\nDURABLE NOTES (carried across sessions for this record — treat as context, weigh against the documents):\n${notes
      .map((n) => `- ${n}`)
      .join("\n")}`;
  }
  return s;
}

function bestScore(existing: Citation | undefined, next: Citation): Citation {
  if (!existing) return next;
  return next.score > existing.score ? next : existing;
}

/** Offline fallback: retrieval-only answer so the demo runs with no LLM key. */
async function stubAnswer(record: DemoRecord, message: string): Promise<OrchestratorResult> {
  const s = store();
  const qEmb = await embedOne(message, "query");
  const hits = await s.search(record.id, qEmb, TOP_K);
  const answer =
    hits.length === 0
      ? "No documents are indexed yet. Seed the demo data or ingest documents first. (Note: ANTHROPIC_API_KEY is not set, so this is a retrieval-only fallback.)"
      : `**Retrieval-only mode** (set \`ANTHROPIC_API_KEY\` to enable the reasoning agent). Most relevant passages from **${record.name}** for "${message}":\n\n` +
        hits.map((h, i) => `**[${i + 1}] ${h.docTitle}** — ${h.snippet}`).join("\n\n");
  return {
    answer,
    citations: hits,
    steps: [
      { type: "tool_call", label: "Search documents", detail: message },
      { type: "tool_result", label: `Retrieved ${hits.length} passage(s)` },
    ],
    usage: emptyUsage,
    model: "retrieval-only (no LLM key)",
  };
}
