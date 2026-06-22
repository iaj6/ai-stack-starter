"use client";

import { useState } from "react";
import {
  ChevronDown,
  Search,
  Calculator,
  CircleCheck,
  CircleAlert,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Quote,
} from "lucide-react";
import type {
  AgentStep,
  Citation,
  GateCheck,
  SystemStatus,
  Usage,
} from "@/components/types";
import { DOMAIN_UI } from "@/domain/ui";

// Domain-supplied label/color maps (the frozen UI just consumes them).
export const STATUS_LABEL: Record<string, string> = DOMAIN_UI.statusLabels;
export const STATUS_COLOR: Record<string, string> = DOMAIN_UI.statusColors;
export const DOC_LABEL: Record<string, string> = DOMAIN_UI.docTypeLabels;

export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-ok" : "bg-gold animate-pulse-dot"}`}
    />
  );
}

export function SystemHealth({
  status,
  vectorStore,
}: {
  status: SystemStatus | null;
  vectorStore: string;
}) {
  if (!status) return null;
  const rows = [
    { label: "LLM", v: status.llm },
    { label: "Embeddings", v: status.embeddings },
    { label: "Vector DB", v: status.vectorDb },
  ];
  return (
    <div className="rounded-lg border border-edge bg-panel/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
        <ShieldCheck className="h-3.5 w-3.5" /> System Health
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2 text-xs">
            <div className="mt-1">
              <StatusDot ok={r.v.ok} />
            </div>
            <div className="min-w-0">
              <div className="text-fg">{r.label}</div>
              <div className="truncate text-[11px] text-faint">{r.v.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentTrace({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  if (!steps?.length) return null;
  return (
    <div className="rounded-lg border border-edge bg-ink2/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted hover:text-fg"
      >
        <span className="flex items-center gap-2">
          <span className="text-brand2">⛓</span> Agent trace · {steps.length} steps
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="space-y-2 border-t border-edge px-3 py-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <StepIcon type={s.type} />
              <div className="min-w-0">
                <div className="text-fg">{s.label}</div>
                {s.detail && (
                  <div className="mt-0.5 truncate font-mono text-[11px] text-faint">{s.detail}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StepIcon({ type }: { type: AgentStep["type"] }) {
  const cls = "h-3.5 w-3.5 mt-0.5 shrink-0";
  if (type === "tool_call") return <Search className={`${cls} text-brand2`} />;
  if (type === "tool_result") return <Calculator className={`${cls} text-gold`} />;
  if (type === "answer") return <CircleCheck className={`${cls} text-ok`} />;
  return <span className={`${cls} text-faint`}>·</span>;
}

export function GuardrailReport({
  input,
  output,
}: {
  input: GateCheck[];
  output: GateCheck[];
}) {
  const all = [...input, ...output];
  if (!all.length) return null;
  const anyFail = all.some((c) => !c.passed);
  return (
    <div className="rounded-lg border border-edge bg-ink2/60">
      <div className="flex items-center gap-2 border-b border-edge px-3 py-2 text-xs font-medium">
        {anyFail ? (
          <ShieldAlert className="h-4 w-4 text-gold" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-ok" />
        )}
        <span className="text-muted">
          Guardrails · {all.filter((c) => c.passed).length}/{all.length} passed
        </span>
      </div>
      <ul className="space-y-1.5 px-3 py-2.5">
        {all.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            {c.passed ? (
              <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk" />
            )}
            <div className="min-w-0">
              <div className="text-fg">{c.name}</div>
              <div className="text-[11px] text-faint">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations?.length) return null;
  return (
    <div className="rounded-lg border border-edge bg-ink2/60">
      <div className="flex items-center gap-2 border-b border-edge px-3 py-2 text-xs font-medium text-muted">
        <Quote className="h-4 w-4 text-brand2" /> Sources · {citations.length}
      </div>
      <ul className="divide-y divide-edge/60">
        {citations.map((c) => (
          <li key={c.chunkId} className="px-3 py-2 text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-fg">
                <FileText className="h-3.5 w-3.5 text-faint" />
                {DOC_LABEL[c.docType] ?? c.docTitle}
              </span>
              <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] text-brand2">
                {(c.score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">{c.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CostMeter({ usage, model }: { usage?: Usage; model?: string }) {
  if (!usage) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
      <span className="font-mono">{model}</span>
      <span>·</span>
      <span>{usage.inputTokens.toLocaleString()} in</span>
      <span>{usage.outputTokens.toLocaleString()} out</span>
      <span>·</span>
      <span className="text-gold">${usage.costUsd.toFixed(4)}</span>
    </div>
  );
}
