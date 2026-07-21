import type { DomainTool, DomainToolResult } from "../../types";

/**
 * Commercial-contracts review example domain — tools.
 *
 * An auditable contract-metric calculator. The agent calls this instead of doing
 * date arithmetic or ratio math in its head, so every renewal deadline,
 * days-until figure, and liability-cap ratio is computed deterministically and
 * shown in the agent trace.
 *
 * All date math parses ISO strings via Date.UTC (no timezone surprises) and
 * never reads the wall clock — callers pass an explicit reference date — so the
 * tool is fully deterministic and reproducible in evals.
 *
 * A new domain replaces this with whatever it needs to compute — or ships zero
 * tools and relies on search alone.
 */

type MetricName = "renewal_deadline" | "days_until" | "liability_cap_ratio";

interface MetricInput {
  metric: MetricName;
  endDate?: string;
  noticeDays?: number;
  targetDate?: string;
  fromDate?: string;
  capAmount?: number;
  annualFees?: number;
}

const DAY_MS = 86_400_000;

/** Parse the YYYY-MM-DD prefix of an ISO string to a UTC timestamp (deterministic, tz-free). */
function parseUtcDate(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
  if (!m) throw new Error(`invalid ISO date "${s}" (expected YYYY-MM-DD)`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatUtcDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function flagNoticeWindow(noticeDays: number): string {
  if (noticeDays < 45)
    return "TIGHT notice window — fewer than 45 days; easy to miss, calendar it now.";
  return "Standard notice window — comfortable lead time to decide on renewal.";
}
function flagDaysUntil(days: number): string {
  if (days < 0) return "PAST DUE — this date has already passed.";
  if (days < 30) return "IMMINENT — under 30 days remaining; act now.";
  return "Comfortable runway — more than 30 days remaining.";
}
function flagCapRatio(ratio: number): string {
  if (ratio > 5)
    return "UNUSUALLY FAVORABLE — cap above ~5x fees is effectively uncapped-equivalent protection.";
  if (ratio < 1) return "THIN protection — cap below one year of fees leaves limited recovery.";
  return "Market-standard range — a cap of roughly 1x–2x annual fees.";
}

function compute(input: MetricInput): { formatted: string; interpretation: string } {
  const need = (...keys: (keyof MetricInput)[]) => {
    for (const k of keys) {
      const v = input[k];
      if (v == null || (typeof v === "number" && Number.isNaN(v))) {
        throw new Error(`missing required input "${String(k)}" for ${input.metric}`);
      }
    }
  };
  switch (input.metric) {
    case "renewal_deadline": {
      need("endDate", "noticeDays");
      const deadlineMs = parseUtcDate(input.endDate!) - input.noticeDays! * DAY_MS;
      return {
        formatted: formatUtcDate(deadlineMs),
        interpretation: flagNoticeWindow(input.noticeDays!),
      };
    }
    case "days_until": {
      need("targetDate", "fromDate");
      const days = Math.round(
        (parseUtcDate(input.targetDate!) - parseUtcDate(input.fromDate!)) / DAY_MS,
      );
      return { formatted: `${days} days`, interpretation: flagDaysUntil(days) };
    }
    case "liability_cap_ratio": {
      need("capAmount", "annualFees");
      if (input.annualFees! === 0) throw new Error("annualFees must be non-zero");
      const ratio = input.capAmount! / input.annualFees!;
      return { formatted: `${ratio.toFixed(1)}x fees`, interpretation: flagCapRatio(ratio) };
    }
    default:
      throw new Error(`unknown metric "${input.metric}"`);
  }
}

const computeContractMetricTool: DomainTool = {
  definition: {
    name: "compute_contract_metric",
    description:
      "Compute an auditable contract metric. Use this for any renewal-notice deadline, days-until-a-date, or liability-cap ratio rather than computing it yourself. Provide the inputs you found in the contract documents. All dates are ISO YYYY-MM-DD; pass an explicit reference date for days_until (do not assume today).",
    input_schema: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["renewal_deadline", "days_until", "liability_cap_ratio"],
          description: "Which metric to compute.",
        },
        endDate: {
          type: "string",
          description: "Contract term end date, ISO YYYY-MM-DD (for renewal_deadline).",
        },
        noticeDays: {
          type: "number",
          description:
            "Days of advance non-renewal notice required before the term end (for renewal_deadline).",
        },
        targetDate: {
          type: "string",
          description: "The future date to count toward, ISO YYYY-MM-DD (for days_until).",
        },
        fromDate: {
          type: "string",
          description:
            "The reference date to count from, ISO YYYY-MM-DD (required for days_until — pass the date the question is asked as of; the tool never reads the clock).",
        },
        capAmount: {
          type: "number",
          description: "Liability cap in dollars (for liability_cap_ratio).",
        },
        annualFees: {
          type: "number",
          description: "Annual contract fees in dollars (for liability_cap_ratio).",
        },
      },
      required: ["metric"],
    },
  },
  run: (input): DomainToolResult => {
    const mi = input as unknown as MetricInput;
    try {
      const r = compute(mi);
      const labels: Record<MetricName, string> = {
        renewal_deadline: "Notice deadline",
        days_until: "Days remaining",
        liability_cap_ratio: "Liability cap",
      };
      const label = labels[mi.metric] ?? String(mi.metric);
      return {
        content: `${label}: ${r.formatted}. ${r.interpretation}`,
        label: `${label} = ${r.formatted}`,
        detail: r.interpretation,
      };
    } catch (e) {
      return {
        content: `Error: ${(e as Error).message}`,
        label: "compute_contract_metric error",
        isError: true,
      };
    }
  },
};

export const contractsTools: DomainTool[] = [computeContractMetricTool];
