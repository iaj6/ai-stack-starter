import type { DomainUI } from "../../types";

/**
 * Commercial-contracts review example domain — UI config (client-safe).
 *
 * "Clause IQ" — a contract-review copilot for an in-house legal team. This is a
 * second example pack proving the skeleton retargets by swapping files under
 * src/domain/packs/. To activate it, point the SWAP POINT in src/domain/ui.ts here.
 */
export const contractsUI: DomainUI = {
  appName: "Clause IQ",
  shortName: "Contract Intelligence",
  tagline: "In-house contract-review copilot",
  entityNoun: "contract",
  entityNounPlural: "contracts",
  pipelineLabel: "Contract Pipeline",
  composerHint:
    "Grounded in contract documents · dates and figures verified against sources · not legal advice",
  suggestions: [
    "What is the last date we can give notice of non-renewal on this contract?",
    "What is the liability cap as a multiple of annual fees, and is that market?",
    "What are our termination rights, and which document states them?",
    "Does this contract auto-renew, and what's the risk if we miss the notice window?",
  ],
  statusLabels: {
    intake: "Intake",
    review: "Under Review",
    negotiation: "In Negotiation",
    executed: "Executed",
  },
  statusColors: {
    intake: "text-muted border-edge2",
    review: "text-brand2 border-brand/40",
    negotiation: "text-gold border-gold/40",
    executed: "text-ok border-ok/40",
  },
  docTypeLabels: {
    agreement_summary: "Agreement Summary",
    order_form: "Order Form",
    amendment: "Amendment",
    redline_notes: "Negotiation Notes",
    renewal_memo: "Renewal Memo",
  },
};
