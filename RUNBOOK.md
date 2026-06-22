# Deploy Runbook — Vercel + Neon

The exact sequence to get a **public** live URL, plus the gotchas. Validated end
to end (Vercel CLI 54). Most of this is scriptable; three steps need a human.

## Prerequisites
- `gh` authed (`gh auth status`) and `vercel` CLI authed (`vercel whoami`).
- Keys in `.env.local`: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` (or `OPENAI_API_KEY`).

## Steps the CLI can do

```bash
# 1. Repo (private)
gh repo create <name> --private --source=. --remote=origin --push

# 2. Link a Vercel project (the GitHub-connect warning is harmless for CLI deploys)
vercel link --yes --project <name>

# 3. Validate the build on Vercel infra (runs in fallback mode for now)
vercel deploy --yes

# … after the three human steps below …

# 4. Production deploy (picks up DB + keys)
vercel deploy --prod --yes

# 5. Seed the live data, then verify
curl -s -X POST https://<prod-url>/api/seed
curl -s https://<prod-url>/api/status
```

## Three steps that need a human (and why)

1. **Provision the database** — `vercel install neon` (pick **Free**, connect to the
   project). Interactive: terms + browser consent. Auto-injects `DATABASE_URL` +
   `POSTGRES_URL` into the project; the app reads `DATABASE_URL || POSTGRES_URL`
   and `pgvector` turns on by itself (Neon allows `CREATE EXTENSION vector`).
2. **Secret API keys** — set them yourself (don't hand secrets to automation):
   ```bash
   grep '^ANTHROPIC_API_KEY=' .env.local | cut -d= -f2- | tr -d '\n' | vercel env add ANTHROPIC_API_KEY production
   grep '^VOYAGE_API_KEY='    .env.local | cut -d= -f2- | tr -d '\n' | vercel env add VOYAGE_API_KEY production
   ```
3. **Make it public** — new Vercel projects ship with **Deployment Protection
   (Vercel Authentication) ON**, so the URL returns **HTTP 401** (an auth wall) and
   isn't shareable. Dashboard → project → **Settings → Deployment Protection →
   Disabled**. (Skip only if you'll demo from your own logged-in browser.)

Get the clean production alias from `vercel inspect <deployment-url>` → Aliases.

## Gotchas (these cost real time the first time)

- **Embedding dimension must match the provider** or pgvector rejects inserts
  ("expected N dimensions, not M"): Voyage `voyage-3` = **1024**, OpenAI
  `text-embedding-3-small` = **1536**, hash fallback = 512. The store sizes the
  `vector(N)` column from the active provider — don't hardcode it.
- **Voyage free tier = 3 req/min.** Seeding embeds **all** chunks in one batched
  request (not one per doc) + retries on 429. Rapid-fire queries (or `npm run eval`,
  which sends several) can still hit the limit; add a payment method for headroom
  (200M free tokens still apply).
- **Editor autosave can clobber CLI-appended `.env.local` lines.** If your editor
  had the file open unsaved and you appended via shell, its next save overwrites
  your line. Reload-from-disk, or re-append after saving.
- **`maxDuration = 60`** on the chat route (Vercel free-tier cap). In-memory store
  is unreliable on serverless (stateless across invocations) — use the real DB in
  prod.
- **Reset the DB cleanly if a seed half-failed:** `DROP TABLE IF EXISTS chunks,
  conversations, record_notes, records CASCADE;` then re-seed. Seeding is
  idempotent (skips already-indexed records), so a partial insert otherwise sticks.
- **Hand the model full passages, not snippets.** Retrieval gives the LLM the full
  chunk text; the 240-char snippet is for UI citations only. Truncating context
  chops the figure the model needs and causes repeated searches.
