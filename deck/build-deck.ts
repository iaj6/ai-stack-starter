/**
 * Generates the non-technical stakeholder deck: Deal-IQ.pptx
 * Run:  npm run deck
 *
 * Audience: a CIO / decision-maker at a private credit manager. No engineering
 * diagrams — the story is problem → what it does → why it's safe → ROI.
 */
import pptxgen from "pptxgenjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Palette (institutional credit-desk)
const INK = "0B1220";
const PANEL = "111D33";
const FG = "E7EEFB";
const MUTED = "93A4C4";
const BRAND = "46B7A6";
const GOLD = "D9A85A";
const RISK = "E87A6F";

const pptx = new pptxgen();
pptx.defineLayout({ name: "HD", width: 13.333, height: 7.5 });
pptx.layout = "HD";
pptx.author = "Deal IQ";
pptx.title = "Deal IQ — AI Deal Intelligence for Private Credit";

function bg(slide: pptxgen.Slide) {
  slide.background = { color: INK };
}

function kicker(slide: pptxgen.Slide, text: string) {
  slide.addText(text.toUpperCase(), {
    x: 0.8,
    y: 0.55,
    w: 11.7,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 12,
    color: BRAND,
    charSpacing: 3,
    bold: true,
  });
}

function heading(slide: pptxgen.Slide, text: string, y = 1.0) {
  slide.addText(text, {
    x: 0.8,
    y,
    w: 11.7,
    h: 1.0,
    fontFace: "Georgia",
    fontSize: 32,
    color: FG,
    bold: true,
  });
}

function footer(slide: pptxgen.Slide, n: number) {
  slide.addText("Deal IQ — Demo", {
    x: 0.8,
    y: 7.0,
    w: 6,
    h: 0.3,
    fontFace: "Arial",
    fontSize: 9,
    color: MUTED,
  });
  slide.addText(String(n), {
    x: 12.2,
    y: 7.0,
    w: 0.5,
    h: 0.3,
    fontFace: "Arial",
    fontSize: 9,
    color: MUTED,
    align: "right",
  });
}

interface Card {
  title: string;
  body: string;
  accent?: string;
}

function cards(slide: pptxgen.Slide, items: Card[], y = 2.4) {
  const n = items.length;
  const gap = 0.35;
  const totalW = 11.7;
  const w = (totalW - gap * (n - 1)) / n;
  items.forEach((it, i) => {
    const x = 0.8 + i * (w + gap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h: 3.4,
      fill: { color: PANEL },
      line: { color: it.accent ?? "25344F", width: 1 },
      rectRadius: 0.12,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 0.08,
      h: 3.4,
      fill: { color: it.accent ?? BRAND },
    });
    slide.addText(it.title, {
      x: x + 0.3,
      y: y + 0.3,
      w: w - 0.6,
      h: 0.9,
      fontFace: "Georgia",
      fontSize: 17,
      color: FG,
      bold: true,
      valign: "top",
    });
    slide.addText(it.body, {
      x: x + 0.3,
      y: y + 1.25,
      w: w - 0.6,
      h: 1.9,
      fontFace: "Arial",
      fontSize: 12.5,
      color: MUTED,
      valign: "top",
      lineSpacingMultiple: 1.15,
    });
  });
}

function bullets(
  slide: pptxgen.Slide,
  items: { label: string; text: string }[],
  y = 2.3,
) {
  const rows = items.map((it) => [
    { text: `${it.label}  `, options: { color: BRAND, bold: true, fontSize: 15 } },
    { text: it.text, options: { color: FG, fontSize: 15 } },
  ]);
  rows.forEach((r, i) => {
    slide.addText(r, {
      x: 0.9,
      y: y + i * 0.85,
      w: 11.5,
      h: 0.75,
      fontFace: "Arial",
      valign: "top",
      lineSpacingMultiple: 1.1,
      bullet: { code: "2022", indent: 18 },
      color: FG,
    });
  });
}

// ── Slide 1 — Title ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: BRAND } });
  s.addText("DEAL IQ", {
    x: 0.9,
    y: 2.5,
    w: 11,
    h: 0.6,
    fontFace: "Arial",
    fontSize: 16,
    color: BRAND,
    charSpacing: 6,
    bold: true,
  });
  s.addText("AI Deal Intelligence for\nPrivate Credit Underwriting", {
    x: 0.85,
    y: 3.0,
    w: 11.5,
    h: 1.8,
    fontFace: "Georgia",
    fontSize: 44,
    color: FG,
    bold: true,
    lineSpacingMultiple: 1.0,
  });
  s.addText(
    "Ask any deal a question. Get a cited, grounded answer in seconds — with the metrics you underwrite on, computed and traceable.",
    {
      x: 0.9,
      y: 4.9,
      w: 10.5,
      h: 1.0,
      fontFace: "Arial",
      fontSize: 15,
      color: MUTED,
      lineSpacingMultiple: 1.2,
    },
  );
  s.addText("Prepared for executive stakeholders  ·  Working demonstration", {
    x: 0.9,
    y: 6.4,
    w: 11,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 12,
    color: GOLD,
  });
}

// ── Slide 2 — The problem ───────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "The problem");
  heading(s, "Underwriting runs on documents — and the answers are buried in them");
  cards(s, [
    {
      title: "Slow to the answer",
      body: "Every deal arrives as a stack of PDFs — offering memo, rent roll, appraisal, financials, loan docs. Finding one figure means reading all of them.",
      accent: GOLD,
    },
    {
      title: "Knowledge walks out the door",
      body: "What an analyst learned on a deal lives in their head and their inbox. When they move on, the firm starts over on the next vintage.",
      accent: GOLD,
    },
    {
      title: "Missed details carry risk",
      body: "A thin DSCR, a single-tenant concentration, a near-term maturity — easy to overlook under deadline, costly to miss for capital preservation.",
      accent: RISK,
    },
  ]);
  footer(s, 2);
}

// ── Slide 3 — What it does ──────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "What Deal IQ does");
  heading(s, "It reads every deal document, so your team can just ask");
  cards(s, [
    {
      title: "Cited answers",
      body: "Ask in plain English. Deal IQ answers only from the deal's own documents and shows you the exact source behind every statement.",
      accent: BRAND,
    },
    {
      title: "Metrics, computed",
      body: "LTV, DSCR, debt yield — calculated automatically from the documents, with the figures and the math an analyst can audit.",
      accent: BRAND,
    },
    {
      title: "Institutional memory",
      body: "Notes and context persist with each deal and across funds, so the firm's knowledge compounds instead of resetting.",
      accent: BRAND,
    },
  ]);
  footer(s, 3);
}

// ── Slide 4 — A day with Deal IQ ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "A day with Deal IQ");
  heading(s, "From a stack of PDFs to a credit view — in minutes");
  bullets(s, [
    { label: "Drop the file.", text: "Offering memo, rent roll, appraisal, borrower financials, loan agreement — indexed on arrival." },
    { label: "Ask the deal.", text: "“What's the LTV?” · “Is DSCR coverage thin?” · “What's the single biggest risk here?”" },
    { label: "Get grounded answers.", text: "Each answer cites the source document, and every metric is computed and traceable — no guesswork." },
    { label: "Keep the knowledge.", text: "Analyst notes stay with the deal and inform the next question, the next analyst, the next fund." },
  ]);
  footer(s, 4);
}

// ── Slide 5 — Why it's safe ─────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "Why it's safe to trust");
  heading(s, "Built for confidential deal data and zero tolerance for made-up numbers");
  cards(
    s,
    [
      {
        title: "Grounded, not guessing",
        body: "Answers come only from your documents. If a figure isn't in the file, Deal IQ says so — it will not invent a number.",
        accent: BRAND,
      },
      {
        title: "Every claim is sourced",
        body: "A guardrail checks each answer: figures must trace to a retrieved document, and the source is shown alongside the answer.",
        accent: BRAND,
      },
      {
        title: "Your data stays yours",
        body: "Deal data is isolated per firm and is not used to train the underlying models. Off-topic or manipulative requests are blocked.",
        accent: GOLD,
      },
    ],
    2.4,
  );
  footer(s, 5);
}

// ── Slide 6 — The value ─────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "The value");
  heading(s, "More deals screened, fewer risks missed, knowledge that compounds");
  bullets(s, [
    { label: "Analyst leverage.", text: "Senior people spend time on judgment, not on hunting for a figure across five PDFs." },
    { label: "Faster screening.", text: "Triage more opportunities per week — say no faster, and spend diligence where it counts." },
    { label: "Capital preservation.", text: "Surfaces the risks the LTV-first discipline is built to catch: thin coverage, concentration, maturities." },
    { label: "Pennies per question.", text: "Each grounded answer costs a few cents of compute — a rounding error against an analyst hour." },
  ]);
  footer(s, 6);
}

// ── Slide 7 — How it's built (plain language) ───────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "Under the hood — in plain terms");
  heading(s, "A modern, secure AI stack — assembled, not experimental");
  bullets(s, [
    { label: "The brain.", text: "A frontier AI model (Claude) reads, reasons, and writes — used through a controlled, auditable workflow." },
    { label: "The library.", text: "Your documents are turned into a searchable knowledge base so the AI retrieves the right passage every time." },
    { label: "The memory.", text: "A secure database keeps deal context and analyst notes so nothing is lost between sessions." },
    { label: "The guardrails.", text: "Automated checks keep answers grounded, on-topic, and sourced — before they ever reach an analyst." },
    { label: "Runs in the cloud.", text: "Delivered as a web application your team opens in a browser — nothing to install, deployed securely." },
  ]);
  footer(s, 7);
}

// ── Slide 8 — Where it goes next ────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  kicker(s, "Where it goes next");
  heading(s, "From a single deal to the whole portfolio");
  cards(s, [
    {
      title: "Portfolio Q&A",
      body: "Ask across every deal and fund at once: “Which loans have a DSCR below 1.10x?” “Where do we have near-term maturities?”",
      accent: BRAND,
    },
    {
      title: "Covenant monitoring",
      body: "Track loan covenants and triggers automatically, and flag the deals that need attention before they become problems.",
      accent: BRAND,
    },
    {
      title: "Draft the IC memo",
      body: "Turn the grounded analysis into a first-draft investment committee memo — sourced, structured, and ready to edit.",
      accent: GOLD,
    },
  ]);
  footer(s, 8);
}

// ── Slide 9 — Close ─────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: GOLD } });
  s.addText("Let's run a deal of yours through it", {
    x: 0.9,
    y: 2.8,
    w: 11.5,
    h: 1.2,
    fontFace: "Georgia",
    fontSize: 36,
    color: FG,
    bold: true,
  });
  s.addText(
    "The fastest way to judge Deal IQ is to point it at a real (redacted) deal file and ask the questions your team asks every day. We can stand that up together.",
    {
      x: 0.9,
      y: 4.1,
      w: 10.8,
      h: 1.2,
      fontFace: "Arial",
      fontSize: 16,
      color: MUTED,
      lineSpacingMultiple: 1.25,
    },
  );
  s.addText("Deal IQ  ·  AI Deal Intelligence for Private Credit", {
    x: 0.9,
    y: 6.3,
    w: 11,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 12,
    color: BRAND,
  });
}

const out = join(__dirname, "Deal-IQ.pptx");
pptx.writeFile({ fileName: out }).then(() => {
  console.log(`\n  ✅ Deck written → ${out}\n`);
});
