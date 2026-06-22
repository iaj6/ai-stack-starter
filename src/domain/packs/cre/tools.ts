import type { DomainTool, DomainToolResult } from "../../types";

/**
 * CRE example domain — tools.
 *
 * An auditable credit-metric calculator. The agent calls this instead of doing
 * mental math, so every LTV / DSCR / debt-yield figure is computed
 * deterministically and shown in the agent trace.
 *
 * A new domain replaces this with whatever it needs to compute (dosage, pricing,
 * risk score, eligibility…) — or ships zero tools and relies on search alone.
 */

type MetricName = "ltv" | "dscr" | "debt_yield" | "debt_per_unit";

interface MetricInput {
  metric: MetricName;
  loanAmount?: number;
  propertyValue?: number;
  noi?: number;
  annualDebtService?: number;
  units?: number;
}

function flagLtv(v: number): string {
  if (v > 0.8) return "HIGH LTV — thin equity cushion; elevated loss-given-default risk.";
  if (v > 0.7) return "Moderate LTV — near the firm's typical first-lien ceiling.";
  return "Conservative LTV — meaningful equity cushion supporting capital preservation.";
}
function flagDscr(v: number): string {
  if (v < 1.0) return "SUB-1.0x DSCR — cash flow does not cover debt service (non-performing / distressed).";
  if (v < 1.15) return "THIN DSCR — limited cushion; sensitive to vacancy or rate moves.";
  return "Healthy DSCR — comfortable debt-service coverage.";
}
function flagDebtYield(v: number): string {
  if (v < 0.08) return "LOW debt yield — below an 8% floor typically sought for first-lien protection.";
  return "Adequate debt yield relative to a typical 8% first-lien floor.";
}

function compute(input: MetricInput): { formatted: string; interpretation: string } {
  const need = (...keys: (keyof MetricInput)[]) => {
    for (const k of keys) {
      if (input[k] == null || Number.isNaN(input[k] as number)) {
        throw new Error(`missing required input "${String(k)}" for ${input.metric}`);
      }
    }
  };
  switch (input.metric) {
    case "ltv": {
      need("loanAmount", "propertyValue");
      const v = input.loanAmount! / input.propertyValue!;
      return { formatted: `${(v * 100).toFixed(1)}%`, interpretation: flagLtv(v) };
    }
    case "dscr": {
      need("noi", "annualDebtService");
      const v = input.noi! / input.annualDebtService!;
      return { formatted: `${v.toFixed(2)}x`, interpretation: flagDscr(v) };
    }
    case "debt_yield": {
      need("noi", "loanAmount");
      const v = input.noi! / input.loanAmount!;
      return { formatted: `${(v * 100).toFixed(1)}%`, interpretation: flagDebtYield(v) };
    }
    case "debt_per_unit": {
      need("loanAmount", "units");
      const v = input.loanAmount! / input.units!;
      return {
        formatted: `$${Math.round(v).toLocaleString()}/unit`,
        interpretation: `Loan basis of $${Math.round(v).toLocaleString()} per unit.`,
      };
    }
    default:
      throw new Error(`unknown metric "${input.metric}"`);
  }
}

const computeMetricTool: DomainTool = {
  definition: {
    name: "compute_metric",
    description:
      "Compute an auditable credit metric. Use this for any LTV, DSCR, debt yield, or debt-per-unit calculation rather than computing it yourself. Provide the inputs you found in the deal documents.",
    input_schema: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["ltv", "dscr", "debt_yield", "debt_per_unit"],
          description: "Which metric to compute.",
        },
        loanAmount: { type: "number", description: "Loan amount or UPB in dollars." },
        propertyValue: { type: "number", description: "Appraised property value in dollars (for LTV)." },
        noi: { type: "number", description: "Net operating income in dollars (for DSCR / debt yield)." },
        annualDebtService: { type: "number", description: "Annual debt service in dollars (for DSCR)." },
        units: { type: "number", description: "Number of units (for debt-per-unit)." },
      },
      required: ["metric"],
    },
  },
  run: (input): DomainToolResult => {
    const mi = input as unknown as MetricInput;
    try {
      const r = compute(mi);
      const m = String(mi.metric).toUpperCase();
      return {
        content: `${m} = ${r.formatted}. ${r.interpretation}`,
        label: `${m} = ${r.formatted}`,
        detail: r.interpretation,
      };
    } catch (e) {
      return { content: `Error: ${(e as Error).message}`, label: "compute_metric error", isError: true };
    }
  },
};

export const creTools: DomainTool[] = [computeMetricTool];
