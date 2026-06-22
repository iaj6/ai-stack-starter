// ── SWAP POINT (server-only) ────────────────────────────────────────────────
// Point this at your domain pack's server config (prompts, tools, seed data).
// Imported only by server code (orchestrator, guardrails, ingest, API routes).
export { creServer as DOMAIN } from "./packs/cre/server";
export type { DomainServer, DomainTool, SeedRecord, SourceDoc } from "./types";
