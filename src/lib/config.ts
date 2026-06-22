/**
 * Central configuration + capability detection.
 *
 * The app is designed to *always run* — every external dependency degrades
 * gracefully to a local fallback so a live demo can never hard-fail on stage.
 * This module is the single source of truth for "what is actually wired up".
 */

export const MODELS = {
  /** The reasoning brain. Opus 4.8 — strongest long-horizon reasoning. */
  brain: "claude-opus-4-8",
  /** Cheap, fast model for guardrail classification + cheap checks. */
  guard: "claude-haiku-4-5",
} as const;

// Published list pricing ($ per 1M tokens) — used for the live cost meter + ROI slide.
export const PRICING = {
  [MODELS.brain]: { input: 5, output: 25 },
  [MODELS.guard]: { input: 1, output: 5 },
} as const;

export function databaseUrl(): string | undefined {
  // Accept either a generic DATABASE_URL or Vercel Postgres' POSTGRES_URL,
  // so a one-click Vercel Postgres provision lights up pgvector automatically.
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export const capabilities = {
  hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  hasVoyage: !!process.env.VOYAGE_API_KEY,
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  get hasDatabase() {
    return !!databaseUrl();
  },
};

export function embeddingProvider(): "voyage" | "openai" | "hash" {
  if (capabilities.hasVoyage) return "voyage";
  if (capabilities.hasOpenAI) return "openai";
  return "hash";
}

export function vectorStoreKind(): "pgvector" | "memory" {
  return capabilities.hasDatabase ? "pgvector" : "memory";
}

/** A human-readable system status for the UI "system health" panel. */
export function systemStatus() {
  return {
    llm: capabilities.hasAnthropic
      ? { ok: true, detail: `Claude (${MODELS.brain})` }
      : { ok: false, detail: "Set ANTHROPIC_API_KEY (LLM stubbed)" },
    embeddings: {
      ok: capabilities.hasVoyage || capabilities.hasOpenAI,
      detail:
        embeddingProvider() === "voyage"
          ? "Voyage AI (voyage-3)"
          : embeddingProvider() === "openai"
            ? "OpenAI (text-embedding-3-small)"
            : "Local hash fallback (set VOYAGE_API_KEY)",
    },
    vectorDb: {
      ok: true,
      detail:
        vectorStoreKind() === "pgvector"
          ? "Postgres + pgvector"
          : "In-memory vector store (set DATABASE_URL for pgvector)",
    },
  };
}
