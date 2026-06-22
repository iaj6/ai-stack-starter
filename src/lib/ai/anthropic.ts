import Anthropic from "@anthropic-ai/sdk";
import { MODELS, PRICING, capabilities } from "@/lib/config";
import type { Usage } from "@/lib/types";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) _client = new Anthropic(); // reads ANTHROPIC_API_KEY
  return _client;
}

export function isLLMConfigured() {
  return capabilities.hasAnthropic;
}

export function costOf(
  model: keyof typeof PRICING,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model];
  return (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
}

export function addUsage(a: Usage, b: Usage): Usage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    costUsd: a.costUsd + b.costUsd,
  };
}

export const emptyUsage: Usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

export { MODELS };
