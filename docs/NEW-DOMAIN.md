# Authoring a new domain pack

You only touch `src/domain/`. The frozen skeleton (RAG, store, guardrails,
orchestrator, UI, eval, deploy) never changes.

## The mental model

The app reasons about **records** (a deal, a patient, a case, a property…), each
with **source documents**. Users ask questions; the agent retrieves passages,
optionally calls **domain tools**, and answers with citations. A domain pack
supplies the words (prompts/labels), the math (tools), and the data (seed).

## Steps

### 1. Copy the example pack
```bash
cp -r src/domain/packs/cre src/domain/packs/<yourname>
```
(`src/domain/packs/contracts/` is a complete second worked example of exactly
this process — compare it against `cre` to see what changes and what doesn't.)

### 2. Reskin — `packs/<yourname>/ui.ts` (client-safe)
Set `appName`, `shortName`, `tagline`, `entityNoun`/`entityNounPlural`,
`pipelineLabel`, `composerHint`, `suggestions`, and the `statusLabels` /
`statusColors` / `docTypeLabels` maps. Status/doc-type **keys** are arbitrary
strings you choose — just keep them consistent with your seed data.
(`statusColors` are Tailwind class strings; reuse the palette: `brand`, `gold`,
`ok`, `risk`, `muted`.)

### 3. Reprompt — `packs/<yourname>/content.ts`
- `SYSTEM_PROMPT`: the assistant's persona + rules. **Don't hardcode a specific
  record** — the orchestrator appends a generic "CURRENT RECORD" block + memory at
  runtime. Tell it to search before answering, cite sources in `[Brackets]`, call
  your tools instead of doing mental math, and refuse to fabricate.
- `GUARDRAIL_SYSTEM`: what's in-scope vs. out-of-scope for the input classifier.

### 4. Retool — `packs/<yourname>/tools.ts`
Each `DomainTool` is `{ definition, run }`. `definition` is an Anthropic tool spec
(`name`, `description`, `input_schema`). `run(input)` returns
`{ content, label, detail? }` — `content` goes to the model, `label`/`detail` show
in the agent trace. Ship zero tools if search alone is enough.

### 5. Repopulate — `packs/<yourname>/seed.ts`
An array of `SeedRecord`: `{ id, name, subtitle, category, status, docs[] }` where
each doc is `{ type, title, text }`. Use **synthetic** data modeled on the target's
real workflow — never real confidential data. Make the numbers internally
consistent so your tools compute cleanly. Good document set: 4–6 docs per record,
each a few hundred words, with the key figures stated explicitly.

### 6. Wire it up — the two SWAP POINTs
```ts
// src/domain/ui.ts
export { <yourname>UI as DOMAIN_UI } from "./packs/<yourname>/ui";
// src/domain/server.ts
export { <yourname>Server as DOMAIN } from "./packs/<yourname>/server";
```
(Update `packs/<yourname>/server.ts` to export under your names.)

### 7. Refresh the supporting artifacts
- `evals/dataset.json` — ground-truth Q&A: `{ recordId, question, mustInclude[],
  expectCitations, expectBlocked }`. `mustInclude` is **any-of** (accepts equivalent
  figure forms). Include one injection case with `expectBlocked: true`.
- `deck/build-deck.ts` — the stakeholder deck copy (problem → what it does → why
  it's safe → ROI). Swap the CRE narrative for your domain's.

### 8. Verify
```bash
npm run build         # typecheck + build
npm run dev           # click Seed, ask your suggestions
npm run eval          # ground-truth pass (needs keys for full credit)
```

## Tips
- Keep `ui.ts` free of seed data / prompts / tool code — it's bundled into the
  client. Heavy/secret stuff lives in `server.ts` and the other pack files.
- Seed at least one **deliberate conflict** between documents (the `cre` pack's
  broker teaser inflates occupancy vs. the rent roll) and add an eval case with
  `mustIncludeAll` requiring both figures. Real corpora disagree; the assistant
  should surface discrepancies, not silently pick a side.
- The agent always has the built-in `search_documents` tool; your tools are merged
  in on top.
- Pick the prospect's **actual** business as the domain — it's relatable and shows
  you understand them.
