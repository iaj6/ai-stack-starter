/**
 * AI Stack Starter — retrieval eval (the other half of the pipeline).
 *
 * run.ts scores the END of the pipeline: the generated answer. This scores
 * the retriever in isolation via /api/retrieve — no LLM involved — so a
 * failure can be attributed: "never retrieved the source" is a different bug
 * from "retrieved it and the model fumbled it".
 *
 * Per labeled query (cases with `relevantDocs`), scored at the document level:
 *   - Recall@k : fraction of the relevant docs present in the top k. The one
 *                that matters most — a doc never retrieved can never be used.
 *   - MRR      : 1 / rank of the first relevant doc.
 *   - nDCG@k   : rank-discounted gain vs. the ideal ordering (binary labels).
 *   - ctx      : do the case's expected answer strings appear verbatim in the
 *                retrieved text? A cheap context-recall proxy — if this fails,
 *                the generator never had a chance.
 *
 * Reports mean AND median: a healthy mean can hide a bimodal retriever that
 * nails most queries and completely misses a few.
 *
 * Usage:  npm run dev             (one terminal)
 *         npm run eval:retrieval  (another)
 *
 * Diagnostic, not a gate — always exits 0. The interesting move is comparing
 * runs across embedding providers (local hash fallback vs. VOYAGE_API_KEY /
 * OPENAI_API_KEY) to quantify exactly what the free fallback costs you.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3007";
const K = Math.max(1, Number(process.env.EVAL_K ?? 5));

interface Case {
  id: string;
  recordId: string;
  question: string;
  mustInclude?: string[];
  mustIncludeAll?: string[];
  expectBlocked?: boolean;
  relevantDocs?: string[];
  reference: string;
}

const datasetFile = process.env.EVAL_DATASET ?? "dataset.json";
const dataset = JSON.parse(readFileSync(join(__dirname, datasetFile), "utf8")) as {
  cases: Case[];
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (x: number) => x.toFixed(2);

async function main() {
  const labeled = dataset.cases.filter((c) => c.relevantDocs?.length && !c.expectBlocked);
  if (labeled.length === 0) {
    console.log("\n  No cases with relevantDocs labels in this dataset.\n");
    return;
  }
  console.log(`\n  AI Stack Starter — retrieval eval @k=${K} → ${BASE}\n`);

  await fetch(`${BASE}/api/seed`, { method: "POST" }).catch(() => {
    throw new Error(`Cannot reach ${BASE}. Start the app with: npm run dev`);
  });

  const recalls: number[] = [];
  const mrrs: number[] = [];
  const ndcgs: number[] = [];

  for (const c of labeled) {
    const url = `${BASE}/api/retrieve?recordId=${encodeURIComponent(c.recordId)}&q=${encodeURIComponent(c.question)}&k=${K}`;
    const res = (await fetch(url).then((r) => r.json())) as {
      hits: { docType: string; text: string }[];
    };

    // Rank docs by their best (first-appearing) chunk.
    const rankedDocs = [...new Set(res.hits.map((h) => h.docType))];
    const relevant = new Set(c.relevantDocs!);

    const recall = c.relevantDocs!.filter((d) => rankedDocs.includes(d)).length / relevant.size;
    const firstIdx = rankedDocs.findIndex((d) => relevant.has(d));
    const mrr = firstIdx === -1 ? 0 : 1 / (firstIdx + 1);
    const dcg = rankedDocs.reduce((s, d, i) => s + (relevant.has(d) ? 1 / Math.log2(i + 2) : 0), 0);
    const ideal = Array.from({ length: Math.min(relevant.size, rankedDocs.length || K) })
      .reduce<number>((s, _, i) => s + 1 / Math.log2(i + 2), 0);
    const ndcg = ideal === 0 ? 0 : dcg / ideal;

    // Context-recall proxy: expected answer strings present in retrieved text.
    const corpus = res.hits.map((h) => h.text).join("\n").toLowerCase();
    const anyOk = !c.mustInclude || c.mustInclude.some((t) => corpus.includes(t.toLowerCase()));
    const allOk = !c.mustIncludeAll || c.mustIncludeAll.every((t) => corpus.includes(t.toLowerCase()));
    const ctx = anyOk && allOk;

    recalls.push(recall);
    mrrs.push(mrr);
    ndcgs.push(ndcg);
    console.log(
      `  ${c.id.padEnd(26)} recall ${fmt(recall)}  mrr ${fmt(mrr)}  ndcg ${fmt(ndcg)}  ctx ${ctx ? "✓" : "✗"}`,
    );
  }

  console.log(`\n  ${"mean".padEnd(26)} recall ${fmt(mean(recalls))}  mrr ${fmt(mean(mrrs))}  ndcg ${fmt(mean(ndcgs))}`);
  console.log(`  ${"median".padEnd(26)} recall ${fmt(median(recalls))}  mrr ${fmt(median(mrrs))}  ndcg ${fmt(median(ndcgs))}\n`);
}

main().catch((e) => {
  console.error(`\n  Retrieval eval failed: ${(e as Error).message}\n`);
  process.exit(1);
});
