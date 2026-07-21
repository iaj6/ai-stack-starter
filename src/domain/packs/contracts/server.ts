import type { DomainServer } from "../../types";
import { SYSTEM_PROMPT, GUARDRAIL_SYSTEM } from "./content";
import { contractsTools } from "./tools";
import { contractsSeed } from "./seed";

/** Commercial-contracts review example domain — server config assembled from its parts. */
export const contractsServer: DomainServer = {
  systemPrompt: SYSTEM_PROMPT,
  guardrailSystem: GUARDRAIL_SYSTEM,
  tools: contractsTools,
  seed: contractsSeed,
};
