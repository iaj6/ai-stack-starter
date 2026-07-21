"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Anchor,
  Building2,
  Send,
  Sparkles,
  Plus,
  BookMarked,
  Loader2,
} from "lucide-react";
import {
  SystemHealth,
  AgentTrace,
  GuardrailReport,
  CitationList,
  CostMeter,
  STATUS_LABEL,
  STATUS_COLOR,
} from "@/components/panels";
import type {
  DemoRecordWithCount,
  UIMessage,
  ChatResponse,
  SystemStatus,
  RecordNoteItem,
} from "@/components/types";
import { DOMAIN_UI } from "@/domain/ui";

const SUGGESTIONS = DOMAIN_UI.suggestions;
const ENTITY = DOMAIN_UI.entityNoun;

export function Workbench() {
  const [records, setDemoRecords] = useState<DemoRecordWithCount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [memories, setMemories] = useState<RecordNoteItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [sessionCost, setSessionCost] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = records.find((d) => d.id === activeId) ?? null;

  const loadDemoRecords = useCallback(async () => {
    const r = await fetch("/api/records").then((x) => x.json());
    setDemoRecords(r.records);
    setActiveId((cur) => cur ?? r.records[0]?.id ?? null);
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((x) => x.json())
      .then((r) => setStatus(r.status));
    // False positive: loadDemoRecords only sets state inside fetch callbacks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDemoRecords();
  }, [loadDemoRecords]);

  // Load conversation + memory when switching records.
  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/chat?recordId=${activeId}`)
      .then((x) => x.json())
      .then((r) => {
        setMessages(r.messages ?? []);
        setMemories(r.memories ?? []);
      });
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function seed() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    await loadDemoRecords();
    setSeeding(false);
  }

  async function send(text: string) {
    if (!activeId || !text.trim() || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "", pending: true },
    ]);
    try {
      const res: ChatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordId: activeId, message: text }),
      }).then((x) => x.json());
      setSessionCost((c) => c + (res.usage?.costUsd ?? 0));
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          steps: res.steps,
          guardrails: res.guardrails,
          usage: res.usage,
          model: res.model,
          blocked: res.blocked,
        };
        return next;
      });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: "Request failed. Check the server logs." };
        return next;
      });
    } finally {
      setBusy(false);
      loadDemoRecords();
    }
  }

  async function addMemory() {
    if (!activeId) return;
    const note = prompt(`Add a durable note for this ${ENTITY} (carried across sessions):`);
    if (!note?.trim()) return;
    const r = await fetch("/api/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recordId: activeId, note }),
    }).then((x) => x.json());
    if (r.memory) setMemories((m) => [r.memory, ...m]);
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.pending);

  return (
    <div className="flex h-screen flex-col overflow-hidden text-fg">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-edge bg-ink2/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/30">
            <Anchor className="h-4 w-4 text-brand2" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              {DOMAIN_UI.appName}
              <span className="rounded bg-edge px-1.5 py-0.5 text-[10px] font-normal text-muted">
                {DOMAIN_UI.shortName}
              </span>
            </div>
            <div className="text-[11px] text-faint">{DOMAIN_UI.tagline}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-faint">
          <span>
            Session spend <span className="font-mono text-gold">${sessionCost.toFixed(4)}</span>
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Left: records + health */}
        <aside className="flex flex-col gap-3 overflow-y-auto border-r border-edge bg-ink2/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {DOMAIN_UI.pipelineLabel}
            </span>
            <button
              onClick={seed}
              disabled={seeding}
              className="flex items-center gap-1 rounded bg-edge px-1.5 py-0.5 text-[10px] text-muted hover:bg-edge2 hover:text-fg"
              title="Load synthetic demo records"
            >
              {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Seed
            </button>
          </div>

          {records.length === 0 && (
            <div className="rounded-lg border border-dashed border-edge2 p-3 text-center text-xs text-faint">
              No records indexed. Click <span className="text-brand2">Seed</span> to load the demo
              portfolio.
            </div>
          )}

          {records.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                d.id === activeId
                  ? "border-brand/50 bg-brand/10"
                  : "border-edge bg-panel/40 hover:border-edge2"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">{d.name}</span>
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
              </div>
              <div className="mt-1 text-[11px] text-faint">{d.subtitle}</div>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${STATUS_COLOR[d.status]}`}
                >
                  {STATUS_LABEL[d.status]}
                </span>
                <span className="font-mono text-[10px] text-faint">{d.chunks} chunks</span>
              </div>
            </button>
          ))}

          <div className="mt-auto">
            <SystemHealth status={status} />
          </div>
        </aside>

        {/* Center: chat */}
        <main className="flex flex-col overflow-hidden">
          {active && (
            <div className="border-b border-edge bg-panel/30 px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">{active.name}</div>
                  <div className="text-xs text-faint">
                    {active.subtitle} · {active.category}
                  </div>
                </div>
                <span className={`rounded border px-2 py-1 text-[11px] ${STATUS_COLOR[active.status]}`}>
                  {STATUS_LABEL[active.status]}
                </span>
              </div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 && active && (
              <div className="mx-auto mt-8 max-w-xl text-center">
                <div className="mb-2 flex justify-center">
                  <Sparkles className="h-6 w-6 text-brand2" />
                </div>
                <h2 className="text-lg font-semibold">Ask anything about {active.name}</h2>
                <p className="mt-1 text-sm text-faint">
                  Answers are grounded in the source documents, with citations and auditable tools.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-edge bg-panel/40 px-3 py-2 text-xs text-muted hover:border-brand/40 hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-edge bg-ink2/60 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="mx-auto flex max-w-2xl items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={active ? `Ask about ${active.name}…` : `Seed a ${ENTITY} to begin`}
                disabled={!active || busy}
                className="max-h-32 flex-1 resize-none rounded-lg border border-edge bg-panel/60 px-3 py-2.5 text-sm outline-none placeholder:text-faint focus:border-brand/50"
              />
              <button
                type="submit"
                disabled={!active || busy || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-ink disabled:opacity-40 hover:bg-brand"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-faint">
              {DOMAIN_UI.composerHint}
            </p>
          </div>
        </main>

        {/* Right: inspector */}
        <aside className="flex flex-col gap-3 overflow-y-auto border-l border-edge bg-ink2/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Inspector
            </span>
            {lastAssistant && <CostMeter usage={lastAssistant.usage} model={lastAssistant.model} />}
          </div>

          {lastAssistant ? (
            <>
              {lastAssistant.guardrails && (
                <GuardrailReport
                  input={lastAssistant.guardrails.input}
                  output={lastAssistant.guardrails.output}
                />
              )}
              {lastAssistant.citations && <CitationList citations={lastAssistant.citations} />}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-edge2 p-3 text-center text-xs text-faint">
              Guardrails, sources, and metrics for each answer appear here.
            </div>
          )}

          {/* DemoRecord memory */}
          <div className="rounded-lg border border-edge bg-ink2/60">
            <div className="flex items-center justify-between border-b border-edge px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <BookMarked className="h-4 w-4 text-gold" /> Memory
              </span>
              <button onClick={addMemory} className="text-faint hover:text-fg" title="Add note">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {memories.length === 0 ? (
              <p className="px-3 py-2.5 text-[11px] text-faint">
                Durable notes carried across sessions and fed to the agent as context.
              </p>
            ) : (
              <ul className="divide-y divide-edge/60">
                {memories.map((m) => (
                  <li key={m.id} className="px-3 py-2 text-[11px] text-muted">
                    {m.note}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand/15 px-3.5 py-2 text-sm ring-1 ring-brand/20">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl rounded-bl-sm border px-3.5 py-2.5 ${
          m.blocked ? "border-risk/40 bg-risk/5" : "border-edge bg-panel/50"
        }`}
      >
        {m.pending ? (
          <div className="flex items-center gap-2 text-sm text-faint">
            <Loader2 className="h-4 w-4 animate-spin text-brand2" />
            Researching the {ENTITY}…
          </div>
        ) : (
          <div className="prose-app text-sm text-fg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {!m.pending && m.steps && m.steps.length > 0 && <AgentTrace steps={m.steps} />}
    </div>
  );
}
