/**
 * AI Stack Starter — LLM evaluation harness.
 *
 * Runs ground-truth underwriting Q&A against the live API and scores each
 * answer on three dimensions a grounded assistant is judged on:
 *   - faithfulness: does it state the correct figure?
 *   - grounding:    are sources cited (no ungrounded numbers)?
 *   - safety:       are out-of-scope / injection prompts blocked?
 *
 * Usage:  npm run dev   (in one terminal)
 *         npm run eval  (in another)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3007";

interface Case {
  id: string;
  recordId: string;
  question: string;
  mustInclude?: string[];
  expectCitations?: boolean;
  expectBlocked?: boolean;
  reference: string;
}

const dataset = JSON.parse(readFileSync(join(__dirname, "dataset.json"), "utf8")) as {
  cases: Case[];
};

async function main() {
  console.log(`\n  AI Stack Starter — eval harness → ${BASE}\n`);

  // Ensure corpus is indexed.
  await fetch(`${BASE}/api/seed`, { method: "POST" }).catch(() => {
    throw new Error(`Cannot reach ${BASE}. Start the app with: npm run dev`);
  });

  let passed = 0;
  const rows: string[] = [];

  for (const c of dataset.cases) {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recordId: c.recordId, message: c.question }),
    }).then((r) => r.json());

    const answer: string = (res.answer ?? "").toLowerCase();
    const checks: { name: string; ok: boolean }[] = [];

    if (c.expectBlocked) {
      checks.push({ name: "blocked", ok: res.blocked === true });
    } else {
      if (c.mustInclude) {
        // anyOf: the answer must state at least one accepted form of the figure
        // (e.g. a computed 89.8% or the document's rounded "90%").
        const hit = c.mustInclude.some((t) => answer.includes(t.toLowerCase()));
        checks.push({ name: `faithful(${c.mustInclude.join("|")})`, ok: hit });
      }
      if (c.expectCitations) {
        checks.push({ name: "grounded", ok: (res.citations?.length ?? 0) > 0 });
      }
    }

    const ok = checks.every((x) => x.ok);
    if (ok) passed++;
    rows.push(
      `  ${ok ? "✅" : "❌"}  ${c.id.padEnd(20)} ${checks
        .map((x) => `${x.ok ? "✓" : "✗"}${x.name}`)
        .join("  ")}`,
    );
  }

  console.log(rows.join("\n"));
  const pct = ((passed / dataset.cases.length) * 100).toFixed(0);
  console.log(`\n  ${passed}/${dataset.cases.length} passed (${pct}%)\n`);
  process.exit(passed === dataset.cases.length ? 0 : 1);
}

main().catch((e) => {
  console.error(`\n  Eval failed: ${(e as Error).message}\n`);
  process.exit(1);
});
