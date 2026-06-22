import { Pool } from "pg";
import { databaseUrl, vectorStoreKind } from "@/lib/config";
import { cosineSim, embeddingDim } from "@/lib/rag/embeddings";
import type { Chunk, Citation, DemoRecord, ChatMessage } from "@/lib/types";

/**
 * Vector DB + memory store.
 *
 * Two interchangeable backends behind one interface:
 *  - PgVectorStore: Postgres + pgvector (cosine distance via the `<=>` operator).
 *    Real persistence — used in the cloud (Vercel Postgres / Neon).
 *  - MemoryStore: in-process fallback so the app runs with zero infrastructure.
 *
 * Also holds two memory surfaces:
 *  - conversation memory (per-record chat history)
 *  - record memory (durable notes / institutional knowledge across sessions)
 */

export interface RecordNote {
  id: string;
  recordId: string;
  note: string;
  createdAt: string;
}

export interface Store {
  kind(): "pgvector" | "memory";
  upsertRecord(record: DemoRecord): Promise<void>;
  listRecords(): Promise<DemoRecord[]>;
  getRecord(id: string): Promise<DemoRecord | null>;
  clearRecord(recordId: string): Promise<void>;
  addChunks(chunks: Chunk[]): Promise<void>;
  chunkCount(recordId: string): Promise<number>;
  /** Cosine-similarity search scoped to one record. */
  search(recordId: string, queryEmbedding: number[], k: number): Promise<Citation[]>;
  // conversation memory
  appendMessage(recordId: string, msg: ChatMessage): Promise<void>;
  getMessages(recordId: string): Promise<ChatMessage[]>;
  // record (institutional) memory
  addMemory(recordId: string, note: string): Promise<RecordNote>;
  getMemories(recordId: string): Promise<RecordNote[]>;
}

function snippet(text: string, n = 240): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

class MemoryStore implements Store {
  private records = new Map<string, DemoRecord>();
  private chunks: Chunk[] = [];
  private convos = new Map<string, ChatMessage[]>();
  private memories = new Map<string, RecordNote[]>();

  kind() {
    return "memory" as const;
  }
  async upsertRecord(record: DemoRecord) {
    this.records.set(record.id, record);
  }
  async listRecords() {
    return [...this.records.values()];
  }
  async getRecord(id: string) {
    return this.records.get(id) ?? null;
  }
  async clearRecord(recordId: string) {
    this.chunks = this.chunks.filter((c) => c.recordId !== recordId);
  }
  async addChunks(chunks: Chunk[]) {
    this.chunks.push(...chunks);
  }
  async chunkCount(recordId: string) {
    return this.chunks.filter((c) => c.recordId === recordId).length;
  }
  async search(recordId: string, q: number[], k: number): Promise<Citation[]> {
    return this.chunks
      .filter((c) => c.recordId === recordId)
      .map((c) => ({
        chunkId: c.id,
        docId: c.docId,
        docTitle: c.docTitle,
        docType: c.docType,
        ordinal: c.ordinal,
        text: c.text,
        snippet: snippet(c.text),
        score: cosineSim(q, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
  async appendMessage(recordId: string, msg: ChatMessage) {
    const arr = this.convos.get(recordId) ?? [];
    arr.push(msg);
    this.convos.set(recordId, arr);
  }
  async getMessages(recordId: string) {
    return this.convos.get(recordId) ?? [];
  }
  async addMemory(recordId: string, note: string) {
    const mem: RecordNote = {
      id: `mem_${this.idCounter++}`,
      recordId,
      note,
      createdAt: new Date().toISOString(),
    };
    const arr = this.memories.get(recordId) ?? [];
    arr.push(mem);
    this.memories.set(recordId, arr);
    return mem;
  }
  async getMemories(recordId: string) {
    return this.memories.get(recordId) ?? [];
  }
  private idCounter = 1;
}

// ---------------------------------------------------------------------------
// pgvector store
// ---------------------------------------------------------------------------

function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

class PgVectorStore implements Store {
  private pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }

  kind() {
    return "pgvector" as const;
  }

  /** Lazily provision schema. Embedding dimension is fixed per deployment. */
  private ensure(dim: number) {
    if (!this.ready) {
      this.ready = (async () => {
        await this.pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS records (
            id text PRIMARY KEY,
            name text NOT NULL,
            subtitle text NOT NULL,
            category text NOT NULL,
            status text NOT NULL
          )`);
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS chunks (
            id text PRIMARY KEY,
            record_id text NOT NULL,
            doc_id text NOT NULL,
            doc_type text NOT NULL,
            doc_title text NOT NULL,
            ordinal int NOT NULL,
            text text NOT NULL,
            embedding vector(${dim}) NOT NULL
          )`);
        await this.pool.query(`CREATE INDEX IF NOT EXISTS chunks_record_idx ON chunks(record_id)`);
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS conversations (
            id bigserial PRIMARY KEY,
            record_id text NOT NULL,
            role text NOT NULL,
            content text NOT NULL,
            citations jsonb,
            created_at timestamptz DEFAULT now()
          )`);
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS record_notes (
            id bigserial PRIMARY KEY,
            record_id text NOT NULL,
            note text NOT NULL,
            created_at timestamptz DEFAULT now()
          )`);
      })();
    }
    return this.ready;
  }

  async upsertRecord(rec: DemoRecord) {
    await this.ensure(embeddingDim());
    await this.pool.query(
      `INSERT INTO records (id,name,subtitle,category,status) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=$2, subtitle=$3, category=$4, status=$5`,
      [rec.id, rec.name, rec.subtitle, rec.category, rec.status],
    );
  }
  async listRecords(): Promise<DemoRecord[]> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(`SELECT * FROM records ORDER BY name`);
    return r.rows as DemoRecord[];
  }
  async getRecord(id: string): Promise<DemoRecord | null> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(`SELECT * FROM records WHERE id=$1`, [id]);
    return (r.rows[0] as DemoRecord) ?? null;
  }
  async clearRecord(recordId: string) {
    await this.ensure(embeddingDim());
    await this.pool.query(`DELETE FROM chunks WHERE record_id=$1`, [recordId]);
  }
  async addChunks(chunks: Chunk[]) {
    if (chunks.length === 0) return;
    await this.ensure(chunks[0].embedding.length);
    for (const c of chunks) {
      await this.pool.query(
        `INSERT INTO chunks (id,record_id,doc_id,doc_type,doc_title,ordinal,text,embedding)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.recordId, c.docId, c.docType, c.docTitle, c.ordinal, c.text, toVectorLiteral(c.embedding)],
      );
    }
  }
  async chunkCount(recordId: string): Promise<number> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(`SELECT count(*)::int AS n FROM chunks WHERE record_id=$1`, [recordId]);
    return r.rows[0].n as number;
  }
  async search(recordId: string, q: number[], k: number): Promise<Citation[]> {
    await this.ensure(q.length);
    const r = await this.pool.query(
      `SELECT id, doc_id, doc_title, doc_type, ordinal, text,
              1 - (embedding <=> $2::vector) AS score
       FROM chunks WHERE record_id=$1
       ORDER BY embedding <=> $2::vector LIMIT $3`,
      [recordId, toVectorLiteral(q), k],
    );
    return r.rows.map((row) => ({
      chunkId: row.id,
      docId: row.doc_id,
      docTitle: row.doc_title,
      docType: row.doc_type,
      ordinal: row.ordinal,
      text: row.text,
      snippet: snippet(row.text),
      score: Number(row.score),
    }));
  }
  async appendMessage(recordId: string, msg: ChatMessage) {
    await this.ensure(embeddingDim());
    await this.pool.query(
      `INSERT INTO conversations (record_id, role, content, citations) VALUES ($1,$2,$3,$4)`,
      [recordId, msg.role, msg.content, JSON.stringify(msg.citations ?? null)],
    );
  }
  async getMessages(recordId: string): Promise<ChatMessage[]> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(
      `SELECT role, content, citations FROM conversations WHERE record_id=$1 ORDER BY id`,
      [recordId],
    );
    return r.rows.map((row) => ({
      role: row.role,
      content: row.content,
      citations: row.citations ?? undefined,
    }));
  }
  async addMemory(recordId: string, note: string): Promise<RecordNote> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(
      `INSERT INTO record_notes (record_id, note) VALUES ($1,$2) RETURNING id, created_at`,
      [recordId, note],
    );
    return { id: String(r.rows[0].id), recordId, note, createdAt: r.rows[0].created_at };
  }
  async getMemories(recordId: string): Promise<RecordNote[]> {
    await this.ensure(embeddingDim());
    const r = await this.pool.query(
      `SELECT id, note, created_at FROM record_notes WHERE record_id=$1 ORDER BY id DESC`,
      [recordId],
    );
    return r.rows.map((row) => ({
      id: String(row.id),
      recordId,
      note: row.note,
      createdAt: row.created_at,
    }));
  }
}

// ---------------------------------------------------------------------------
// Singleton — survives hot reloads in dev via globalThis.
// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __appStore?: Store };

export function store(): Store {
  if (!g.__appStore) {
    g.__appStore =
      vectorStoreKind() === "pgvector"
        ? new PgVectorStore(databaseUrl()!)
        : new MemoryStore();
  }
  return g.__appStore;
}
