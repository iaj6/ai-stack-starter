import type { DomainUI } from "../../types";

/**
 * CRE private-credit example domain — UI config (client-safe).
 *
 * To build a new domain, copy this file, change the strings, and update the
 * SWAP POINT in src/domain/ui.ts.
 */
export const creUI: DomainUI = {
  appName: "Deal IQ",
  shortName: "Deal Intelligence",
  tagline: "Private credit underwriting copilot",
  entityNoun: "deal",
  entityNounPlural: "deals",
  pipelineLabel: "Deal Pipeline",
  composerHint:
    "Grounded in deal documents · figures verified against sources · not investment advice",
  suggestions: [
    "What is the LTV on this deal, and how is it calculated?",
    "Compute the DSCR and flag any coverage risk.",
    "Summarize the top risks an analyst should weigh here.",
    "What is the appraised value, and which document states it?",
  ],
  statusLabels: {
    screening: "Screening",
    underwriting: "Underwriting",
    ic_review: "IC Review",
    closed: "Closed",
  },
  statusColors: {
    screening: "text-muted border-edge2",
    underwriting: "text-brand2 border-brand/40",
    ic_review: "text-gold border-gold/40",
    closed: "text-ok border-ok/40",
  },
  docTypeLabels: {
    offering_memo: "Offering Memo",
    rent_roll: "Rent Roll",
    appraisal: "Appraisal",
    borrower_financials: "Borrower Financials",
    loan_agreement: "Loan Agreement",
    broker_teaser: "Broker Teaser",
  },
};
