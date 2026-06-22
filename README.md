# AI Stack Starter

A reusable, end-to-end skeleton for a **document-grounded AI assistant** — built to
stand up a complete, demonstrable AI application fast. Everything is wired; you
swap a thin **domain pack** to retarget it (deals → patients → cases → contracts →
anything with records + documents + questions).

Ships with a working example domain: **Deal IQ**, a private-credit CRE
underwriting copilot.

**Deliberately framework-light.** No LangChain, no wrapper SDKs — every layer
(retrieval, orchestration, guardrails, evals) is small, readable code you can
audit and swap. Managed stacks hide these mechanics; this repo exists to show
them.

## What's in the box (every layer of a production LLM app)

| Layer | Implementation | Frozen? |
|---|---|---|
| **Framework** | Next.js (App Router) full-stack, TypeScript | ✅ |
| **Orchestration** | Manual tool-calling agent loop: retrieve → tools → answer (`src/lib/orchestrator.ts`) | ✅ |
| **LLM** | Claude — Opus 4.8 (reasoning) + Haiku 4.5 (guardrail classifier), official Anthropic SDK | ✅ |
| **Embeddings** | Voyage `voyage-3` → OpenAI → local hash fallback (auto dim-sizing, 429 retry) | ✅ |
| **Vector DB** | Postgres + `pgvector`, with in-memory fallback | ✅ |
| **Memory** | Conversation memory + durable per-record notes | ✅ |
| **Guardrails** | Input gate (injection + scope) + output gate (figure grounding) | ✅ |
| **LLM eval** | Ground-truth harness scoring faithfulness / grounding / safety | ✅ |
| **UI** | Workbench: chat, agent trace, guardrail panel, citations, memory, cost meter | ✅ |
| **Deployment** | Vercel + Neon (see `RUNBOOK.md`) | ✅ |
| **Deck** | Non-technical stakeholder PowerPoint generator (`deck/`) | example |
| **Domain pack** | Prompts · tools · synthetic data · UI labels (`src/domain/`) | **you swap this** |

> **Always-runnable by design.** Every external dependency degrades gracefully:
> no DB → in-memory store; no embedding key → hash embeddings; no LLM key →
> retrieval-only answers. The app cannot hard-fail on stage.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY + VOYAGE_API_KEY
npm run dev                  # http://localhost:3007
```

Click **Seed**, pick a record, ask away. With no keys it still runs (retrieval-only);
add keys to light up the full agent. Optional local pgvector: `docker compose up -d`
then set `DATABASE_URL=postgres://app:app@localhost:5439/app`.

Models are pinned in `src/lib/config.ts` (Opus 4.8 reasoning, Haiku 4.5
guardrails); swapping tiers — including the Claude 5 family — is a one-line
model-ID change there.

## Retarget it to a new domain (≈45 min)

**You only touch `src/domain/`.** The frozen skeleton never changes. Copy the
example pack and edit four things — see **[`docs/NEW-DOMAIN.md`](docs/NEW-DOMAIN.md)**
for the step-by-step.

```
src/domain/
  types.ts                 # the domain-pack contract (don't edit)
  ui.ts        ← SWAP POINT (client-safe): points at packs/<name>/ui
  server.ts    ← SWAP POINT (server-only): points at packs/<name>/server
  packs/cre/
    ui.ts          # app name, labels, suggestions, status colors  (1) reskin
    content.ts     # system prompt + guardrail scope               (2) reprompt
    tools.ts       # the domain's compute tools (LTV/DSCR → yours)  (3) retool
    seed.ts        # synthetic records + documents                 (4) repopulate
    server.ts      # assembles the above
```

Then point the two SWAP POINTs at your new pack, update the deck copy in
`deck/build-deck.ts`, and refresh `evals/dataset.json` with ground-truth Q&A.

## Scripts

```bash
npm run dev      # local dev (port 3007)
npm run build    # production build
npm run eval     # ground-truth eval (run `npm run dev` first)
npm run deck     # generate the stakeholder PowerPoint → deck/*.pptx
```

## Deploy

See **[`RUNBOOK.md`](RUNBOOK.md)** — the exact Vercel + Neon sequence, including the
three steps that need a human (login, secret keys, deployment-protection toggle)
and the gotchas (embedding dims, free-tier rate limits, the auth wall).

---

_Synthetic data only. The example domain is illustrative; not professional advice._
