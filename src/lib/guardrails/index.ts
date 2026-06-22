import { anthropic, MODELS, costOf } from "@/lib/ai/anthropic";
import { DOMAIN } from "@/domain/server";
import { capabilities } from "@/lib/config";
import type { Citation, Usage } from "@/lib/types";

export interface GateCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface InputGateResult {
  allowed: boolean;
  checks: GateCheck[];
  usage: Usage;
}

export interface OutputGateResult {
  flagged: boolean;
  checks: GateCheck[];
  answer: string;
}

const INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /ignore (the |your |all )?(previous|prior|above)\s+(instructions|prompt)/i, label: "instruction override" },
  { re: /disregard (the |your )?(system|previous|all)/i, label: "instruction override" },
  { re: /(reveal|show|print|repeat)\s+(your|the)\s+(system\s+)?prompt/i, label: "system-prompt exfiltration" },
  { re: /you are now|act as|pretend to be|jailbreak|developer mode/i, label: "role hijack" },
];

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    inScope: { type: "boolean" },
    category: {
      type: "string",
      enum: ["domain_question", "out_of_scope", "prompt_injection", "data_exfiltration"],
    },
    reason: { type: "string" },
  },
  required: ["inScope", "category", "reason"],
  additionalProperties: false,
} as const;

interface Verdict {
  inScope: boolean;
  category: string;
  reason: string;
}

/** Input guardrail: pattern checks + (when available) an LLM scope classifier. */
export async function inputGate(message: string): Promise<InputGateResult> {
  const checks: GateCheck[] = [];
  let usage: Usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  // 1. Fast deterministic injection screen.
  const injection = INJECTION_PATTERNS.find((p) => p.re.test(message));
  checks.push({
    name: "Prompt-injection screen",
    passed: !injection,
    detail: injection ? `Matched pattern: ${injection.label}` : "No override/exfiltration patterns",
  });

  // 2. LLM scope classifier (Haiku — cheap). Skipped if no key (fail-open to patterns).
  if (capabilities.hasAnthropic) {
    try {
      const res = await anthropic().messages.create({
        model: MODELS.guard,
        max_tokens: 256,
        system: DOMAIN.guardrailSystem,
        messages: [{ role: "user", content: message }],
        output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
      });
      usage = {
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
        costUsd: costOf(MODELS.guard, res.usage.input_tokens, res.usage.output_tokens),
      };
      const text = res.content
        .map((b) => ("text" in b ? b.text : ""))
        .join("");
      const v = JSON.parse(text) as Verdict;
      checks.push({
        name: "Scope classifier (Claude Haiku)",
        passed: v.inScope,
        detail: `${v.category}: ${v.reason}`,
      });
    } catch {
      checks.push({
        name: "Scope classifier (Claude Haiku)",
        passed: true,
        detail: "Classifier unavailable — relied on pattern screen",
      });
    }
  } else {
    checks.push({
      name: "Scope classifier (Claude Haiku)",
      passed: true,
      detail: "LLM not configured — relied on pattern screen",
    });
  }

  return { allowed: checks.every((c) => c.passed), checks, usage };
}

/**
 * Output guardrail: grounding/citation enforcement. A grounded assistant must
 * not surface figures it can't cite. We check that any answer asserting numbers
 * is backed by retrieved citations, and surface the result rather than silently
 * trusting the model.
 *
 * Note: this is a deliberately simple regex heuristic to make the guardrail
 * visible and testable — a production grounding verifier would match each
 * figure against the retrieved passages (or use an LLM checker).
 */
export function outputGate(answer: string, citations: Citation[]): OutputGateResult {
  const checks: GateCheck[] = [];

  const hasNumbers = /(\$[\d,]+(\.\d+)?|\d+(\.\d+)?\s?%|\d+\.\d+x)/.test(answer);
  const hasBracketCite = /\[[^\]]+\]/.test(answer);
  const hasRetrieval = citations.length > 0;

  // If the model asserts figures, it must be grounded in retrieved docs.
  const grounded = !hasNumbers || hasRetrieval;
  checks.push({
    name: "Figure grounding",
    passed: grounded,
    detail: hasNumbers
      ? hasRetrieval
        ? `Numeric claims backed by ${citations.length} retrieved source(s)`
        : "Numeric claims present with no retrieved sources — flagged"
      : "No numeric claims to ground",
  });

  // Encourage explicit source attribution in prose.
  checks.push({
    name: "Source attribution",
    passed: !hasNumbers || hasBracketCite || hasRetrieval,
    detail: hasBracketCite ? "Answer cites source documents inline" : "Citations shown in source panel",
  });

  let finalAnswer = answer;
  const flagged = checks.some((c) => !c.passed);
  if (flagged) {
    finalAnswer +=
      "\n\n> ⚠️ **Grounding notice:** part of this response asserts figures that were not matched to a retrieved source document. Verify against the source documents before relying on it.";
  }

  return { flagged, checks, answer: finalAnswer };
}
