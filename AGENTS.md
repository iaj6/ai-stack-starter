<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Stack Starter — project notes

A reusable, domain-agnostic skeleton for a document-grounded AI assistant
(see README.md). End-to-end LLM stack: Next.js 16 + Anthropic SDK (Claude Opus
4.8 / Haiku 4.5) + Voyage/OpenAI embeddings + Postgres/pgvector (in-memory
fallback) + guardrails + eval harness + a stakeholder deck. Ships with a CRE
private-credit example domain.

**The frozen/domain split is the whole point:**
- Everything in `src/lib`, `src/app`, `src/components` is the **frozen skeleton** —
  domain-agnostic. Don't put domain specifics there.
- Everything domain-specific lives behind `src/domain/` (prompts, tools, seed,
  UI labels). To retarget the app, edit a pack under `src/domain/packs/<name>/`
  and repoint the two SWAP POINTs (`src/domain/ui.ts`, `src/domain/server.ts`).
  See `docs/NEW-DOMAIN.md`.

Key conventions:
- **Always-runnable:** every external dependency has a graceful fallback
  (`src/lib/config.ts`). Don't add hard requirements on a key or the DB.
- **Grounding is the product:** answers must cite retrieved documents; the
  output guardrail flags ungrounded figures. Never let the agent invent numbers.
- The core entity is a generic `DemoRecord` (`id, name, subtitle, category,
  status`); its documents are `RecordDocument`. Keep skeleton code domain-neutral.
- `DOMAIN_UI` (`@/domain/ui`) is client-safe; `DOMAIN` (`@/domain/server`) is
  server-only (holds prompts, tools, seed) — don't import it into client code.
- Dev port **3007**; local pgvector **5439** (`docker compose up -d`).
- Models: exact IDs in `src/lib/config.ts` (`claude-opus-4-8`, `claude-haiku-4-5`);
  adaptive thinking; no `budget_tokens`/sampling params.
- Deploy + gotchas: `RUNBOOK.md`.
