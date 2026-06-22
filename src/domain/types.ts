// ───────────────────────────────────────────────────────────────────────────
// Domain pack contract.
//
// Everything domain-specific lives behind these interfaces. To build a new demo
// you implement one pack under src/domain/packs/<name>/ and point src/domain/ui.ts
// and src/domain/server.ts at it. The frozen skeleton never changes.
// ───────────────────────────────────────────────────────────────────────────

export type DocType = string;

export interface SourceDoc {
  /** A category key, e.g. "offering_memo" | "lab_report" | "contract". */
  type: DocType;
  title: string;
  text: string;
}

/** One synthetic record + its documents, used to seed the demo. */
export interface SeedRecord {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  status: string;
  docs: SourceDoc[];
}

export interface DomainToolResult {
  /** Text returned to the model. */
  content: string;
  /** Short label for the agent-trace UI. */
  label: string;
  detail?: string;
  isError?: boolean;
}

/** A domain-specific tool the agent can call (in addition to the built-in search). */
export interface DomainTool {
  definition: {
    name: string;
    description: string;
    input_schema: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
  run: (input: Record<string, unknown>) => DomainToolResult;
}

/** Client-safe presentation strings (no secrets, no heavy data). */
export interface DomainUI {
  appName: string;
  shortName: string;
  tagline: string;
  /** Singular entity noun, e.g. "deal", "patient", "case". */
  entityNoun: string;
  entityNounPlural: string;
  /** Sidebar heading, e.g. "Deal Pipeline". */
  pipelineLabel: string;
  /** Small print under the chat composer. */
  composerHint: string;
  suggestions: string[];
  statusLabels: Record<string, string>;
  /** Tailwind class strings per status, e.g. "text-brand2 border-brand/40". */
  statusColors: Record<string, string>;
  docTypeLabels: Record<string, string>;
}

/** Server-only domain logic: prompts, tools, and seed data. */
export interface DomainServer {
  systemPrompt: string;
  guardrailSystem: string;
  tools: DomainTool[];
  seed: SeedRecord[];
}
