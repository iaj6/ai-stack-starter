import { embeddingProvider } from "@/lib/config";

/**
 * Embedding provider abstraction.
 *
 * Voyage AI (voyage-3) is Anthropic's recommended embedding model and the
 * default. Falls back to OpenAI text-embedding-3-small, then to a deterministic
 * local hash embedding so retrieval still functions with zero API keys (lower
 * quality, but the demo never breaks).
 */

const VOYAGE_MODEL = "voyage-3";
const OPENAI_MODEL = "text-embedding-3-small";
const HASH_DIM = 512;

/** Output dimensionality of the active embedding provider — used to size the
 *  pgvector column so it matches what we actually store. */
export function embeddingDim(): number {
  switch (embeddingProvider()) {
    case "voyage":
      return 1024; // voyage-3
    case "openai":
      return 1536; // text-embedding-3-small
    default:
      return HASH_DIM;
  }
}

export function embeddingModelName(): string {
  switch (embeddingProvider()) {
    case "voyage":
      return `Voyage ${VOYAGE_MODEL}`;
    case "openai":
      return `OpenAI ${OPENAI_MODEL}`;
    default:
      return "local-hash-512";
  }
}

export async function embed(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<number[][]> {
  switch (embeddingProvider()) {
    case "voyage":
      return embedVoyage(texts, inputType);
    case "openai":
      return embedOpenAI(texts);
    default:
      return texts.map(hashEmbed);
  }
}

export async function embedOne(
  text: string,
  inputType: "document" | "query" = "query",
): Promise<number[]> {
  return (await embed([text], inputType))[0];
}

/** POST with retry/backoff on 429 (and 5xx) — free embedding tiers are rate-limited. */
async function postWithRetry(url: string, headers: Record<string, string>, body: unknown) {
  const backoffMs = [1500, 4000, 9000];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < backoffMs.length) {
      const retryAfter = Number(res.headers.get("retry-after")) * 1000;
      await new Promise((r) => setTimeout(r, retryAfter || backoffMs[attempt]));
      continue;
    }
    throw new Error(`Embeddings request failed: ${res.status} ${await res.text()}`);
  }
}

async function embedVoyage(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  const res = await postWithRetry(
    "https://api.voyageai.com/v1/embeddings",
    {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    { input: texts, model: VOYAGE_MODEL, input_type: inputType },
  );
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const res = await postWithRetry(
    "https://api.openai.com/v1/embeddings",
    {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    { input: texts, model: OPENAI_MODEL },
  );
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

/**
 * Deterministic bag-of-words hash embedding. Not semantically strong, but good
 * enough for keyword-ish retrieval over a small synthetic corpus, and it keeps
 * the whole pipeline runnable offline.
 */
function hashEmbed(text: string): number[] {
  const vec = new Array(HASH_DIM).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[Math.abs(h) % HASH_DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
