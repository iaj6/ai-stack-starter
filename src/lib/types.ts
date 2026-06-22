// Frozen, domain-agnostic data model. Domain specifics (what a "record" and its
// documents mean) are supplied by the domain pack in src/domain.

export type DocType = string;

/** The core entity the app reasons about — a deal, a patient, a case, a property… */
export interface DemoRecord {
  id: string;
  name: string;
  /** One-line descriptor shown under the name. */
  subtitle: string;
  /** Grouping bucket — fund, team, portfolio, department, etc. */
  category: string;
  /** Key into the domain's statusLabels/statusColors. */
  status: string;
}

export interface RecordDocument {
  id: string;
  recordId: string;
  type: DocType;
  title: string;
  text: string;
}

/** A retrievable, embedded slice of a document. */
export interface Chunk {
  id: string;
  recordId: string;
  docId: string;
  docType: DocType;
  docTitle: string;
  ordinal: number;
  text: string;
  embedding: number[];
}

/** A retrieval hit handed to the model and surfaced in the UI. */
export interface Citation {
  chunkId: string;
  docId: string;
  docTitle: string;
  docType: DocType;
  ordinal: number;
  /** Full passage text — given to the model so figures aren't truncated. */
  text: string;
  /** Shortened version for compact citation display in the UI. */
  snippet: string;
  score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AgentStep {
  type: "tool_call" | "tool_result" | "thinking" | "answer";
  label: string;
  detail?: string;
}
