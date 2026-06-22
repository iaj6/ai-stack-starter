import type { DomainServer } from "../../types";
import { SYSTEM_PROMPT, GUARDRAIL_SYSTEM } from "./content";
import { creTools } from "./tools";
import { creSeed } from "./seed";

/** CRE example domain — server config assembled from its parts. */
export const creServer: DomainServer = {
  systemPrompt: SYSTEM_PROMPT,
  guardrailSystem: GUARDRAIL_SYSTEM,
  tools: creTools,
  seed: creSeed,
};
