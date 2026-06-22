import type { Citation, AgentStep, Usage } from "@/lib/types";

export interface DemoRecordWithCount {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  status: string;
  chunks: number;
}

export interface GateCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  steps: AgentStep[];
  blocked: boolean;
  guardrails: { input: GateCheck[]; output: GateCheck[] };
  usage: Usage;
  model: string;
}

export interface UIMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  steps?: AgentStep[];
  guardrails?: { input: GateCheck[]; output: GateCheck[] };
  usage?: Usage;
  model?: string;
  blocked?: boolean;
  pending?: boolean;
}

export interface SystemStatus {
  llm: { ok: boolean; detail: string };
  embeddings: { ok: boolean; detail: string };
  vectorDb: { ok: boolean; detail: string };
}

export interface RecordNoteItem {
  id: string;
  recordId: string;
  note: string;
  createdAt: string;
}

export type { Citation, AgentStep, Usage };
