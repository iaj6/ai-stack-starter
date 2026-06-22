import { store } from "@/lib/db/store";
import { chunkText } from "@/lib/rag/chunk";
import { embed } from "@/lib/rag/embeddings";
import { DOMAIN } from "@/domain/server";
import type { Chunk, DocType } from "@/lib/types";

/** Chunk → embed → persist one document. Returns number of chunks indexed. */
export async function ingestDocument(opts: {
  recordId: string;
  docId: string;
  type: DocType;
  title: string;
  text: string;
}): Promise<number> {
  const { recordId, docId, type, title, text } = opts;
  const pieces = chunkText(text);
  if (pieces.length === 0) return 0;
  const embeddings = await embed(pieces, "document");
  const chunks: Chunk[] = pieces.map((p, i) => ({
    id: `${docId}__${i}`,
    recordId,
    docId,
    docType: type,
    docTitle: title,
    ordinal: i,
    text: p,
    embedding: embeddings[i],
  }));
  await store().addChunks(chunks);
  return chunks.length;
}

/**
 * Idempotently load the synthetic demo records + documents.
 *
 * Embeds ALL chunks across every document in a single batched request — free
 * embedding tiers are rate-limited (Voyage free tier is 3 RPM), so one call
 * keeps seeding fast and avoids 429s.
 */
export async function seedDemoData(): Promise<{ records: number; chunks: number }> {
  const s = store();

  // Upsert records, and collect chunks only for records not yet indexed.
  type Pending = Omit<Chunk, "embedding">;
  const pending: Pending[] = [];
  let alreadyIndexed = 0;

  for (const rec of DOMAIN.seed) {
    await s.upsertRecord({
      id: rec.id,
      name: rec.name,
      subtitle: rec.subtitle,
      category: rec.category,
      status: rec.status,
    });
    if ((await s.chunkCount(rec.id)) > 0) {
      alreadyIndexed += await s.chunkCount(rec.id);
      continue;
    }
    for (const doc of rec.docs) {
      const docId = `${rec.id}__${doc.type}`;
      chunkText(doc.text).forEach((text, i) => {
        pending.push({
          id: `${docId}__${i}`,
          recordId: rec.id,
          docId,
          docType: doc.type,
          docTitle: doc.title,
          ordinal: i,
          text,
        });
      });
    }
  }

  if (pending.length > 0) {
    const embeddings = await embed(
      pending.map((p) => p.text),
      "document",
    );
    await store().addChunks(pending.map((p, i) => ({ ...p, embedding: embeddings[i] })));
  }

  return { records: DOMAIN.seed.length, chunks: alreadyIndexed + pending.length };
}
