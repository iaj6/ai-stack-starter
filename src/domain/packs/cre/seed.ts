import type { SeedRecord } from "../../types";

/**
 * CRE private-credit example domain — synthetic seed data.
 *
 * Entirely fictional — no real borrower or property data — modeled on a
 * first-lien-origination + NPL-acquisition strategy. Numbers are internally
 * consistent so LTV / DSCR / debt-yield compute cleanly.
 *
 * A new domain replaces this array with its own synthetic records + documents.
 * `subtitle` = the one-liner under the name; `category` = the grouping bucket.
 */
export const creSeed: SeedRecord[] = [
  {
    id: "maple-court",
    name: "Maple Court Apartments",
    subtitle: "184-unit Class B multifamily, Columbus OH",
    category: "Bluepine Credit Fund III",
    status: "underwriting",
    docs: [
      {
        type: "offering_memo",
        title: "Offering Memorandum",
        text: `MAPLE COURT APARTMENTS — SENIOR SECURED BRIDGE LOAN
Transaction type: New origination of a first-lien, senior secured bridge loan.
Borrower / Sponsor: Maplewood Residential Partners LLC.
Property: Maple Court Apartments, 184 garden-style units, Columbus, Ohio. Built 1998, renovated 2019.
Business plan: Sponsor is acquiring the property and executing a value-add renovation of 96 classic units to push rents to the renovated premium.

Loan amount: $18,400,000.
Loan structure: 36-month term, interest-only, one 12-month extension option.
Interest rate: SOFR + 3.25% (all-in approximately 8.60% at close).
As-is appraised value: $26,300,000. As-stabilized appraised value: $31,000,000.
Origination fee: 1.00%. Exit fee: 0.50%.
Primary underwriting criterion is loan-to-value. As-is LTV is approximately 70%.

Capital preservation thesis: senior, first-lien position with a 30% equity cushion at the as-is value, in a supply-constrained submarket. Downside protected by replacement cost and in-place cash flow.`,
      },
      {
        type: "rent_roll",
        title: "Rent Roll",
        text: `MAPLE COURT APARTMENTS — RENT ROLL SUMMARY (as of reporting date)
Total units: 184. Occupied units: 167. Physical occupancy: 91%.
Average in-place rent: $1,365 / unit / month.
Gross potential rent (annualized): $3,013,920.
Economic occupancy: 89%.
Unit mix: 64 one-bedroom ($1,180 avg), 96 two-bedroom ($1,420 avg), 24 three-bedroom ($1,690 avg).
Renovated units (28 completed): achieving a $190/month premium over classic units.
Trailing-12 effective gross income: $2,712,000.
No single tenant represents a concentration; residential lease terms are 12 months.`,
      },
      {
        type: "appraisal",
        title: "Appraisal Report",
        text: `MAPLE COURT APARTMENTS — APPRAISAL SUMMARY
As-is market value: $26,300,000.
As-stabilized market value (upon completion of renovation): $31,000,000.
Valuation approach: direct capitalization and sales comparison.
In-place net operating income (NOI): $1,710,000.
Capitalization rate applied: 6.50%.
Replacement cost estimate: $29,800,000.
Comparable sales: four Columbus garden-style multifamily trades between $138,000 and $151,000 per unit in the trailing 18 months; subject is valued at $142,900 per unit as-is.
The appraiser notes the Columbus multifamily submarket vacancy at 5.8% and positive net absorption.`,
      },
      {
        type: "borrower_financials",
        title: "Borrower Financial Statements",
        text: `MAPLEWOOD RESIDENTIAL PARTNERS LLC — SPONSOR FINANCIAL SUMMARY
Reported net worth: $42,000,000.
Reported liquidity (cash and marketable securities): $6,800,000.
Real estate portfolio: 9 multifamily assets, 2,140 units across Ohio and Indiana.
Schedule of real estate owned shows weighted-average portfolio occupancy of 93%.
Contingent liabilities: $3,200,000 in recourse carve-out guarantees.
Sponsor track record: 14 completed value-add multifamily projects since 2011; no prior defaults reported.
Property-level operating statement (trailing 12 months): effective gross income $2,712,000; operating expenses $1,002,000; net operating income $1,710,000.`,
      },
      {
        // Deliberately conflicts with the rent roll (91% physical occupancy)
        // and appraisal ($31.0M as-stabilized): exercises the conflicting-
        // sources prompt rule and the mustIncludeAll eval case. Real corpora
        // disagree; the assistant must surface both figures, not pick one.
        type: "broker_teaser",
        title: "Broker Marketing Teaser",
        text: `MAPLE COURT APARTMENTS — EXCLUSIVE OFFERING SUMMARY (BROKER TEASER)
Broker marketing material prepared by the listing agent. Figures are the broker's own.
Maple Court Apartments: 184 units in one of Columbus's strongest rental submarkets.
Occupancy: 95%, with waiting-list demand for renovated units.
Pro-forma net operating income: $1,950,000 (assumes full renovation premium capture and 3% annual rent growth).
Broker opinion of stabilized value: $32,500,000.
28 renovated units already achieving a $190/month premium — 96 units of remaining value-add runway.
All figures subject to buyer verification and independent appraisal.`,
      },
      {
        type: "loan_agreement",
        title: "Loan Agreement",
        text: `MAPLE COURT — SUMMARY OF KEY LOAN TERMS AND COVENANTS
Lien position: first-lien, senior secured.
Annual debt service (interest-only at 8.60% on $18,400,000): approximately $1,582,400.
Financial covenants: minimum debt service coverage ratio (DSCR) of 1.05x tested quarterly beginning month 12; minimum debt yield of 8.0%.
Cash management: springing lockbox triggered if DSCR falls below 1.10x.
Reserves: $1,250,000 capex/renovation reserve funded at close; 4 months of interest reserve.
Recourse: non-recourse with standard bad-boy carve-outs guaranteed by the sponsor.
Prepayment: 12 months of spread maintenance, open thereafter.
Events of default include failure to maintain the minimum DSCR covenant after the testing date.`,
      },
    ],
  },
  {
    id: "gateway-logistics",
    name: "Gateway Logistics Center",
    subtitle: "412,000 sf single-tenant industrial, Phoenix AZ",
    category: "Bluepine Credit Fund IV",
    status: "ic_review",
    docs: [
      {
        type: "offering_memo",
        title: "Offering Memorandum",
        text: `GATEWAY LOGISTICS CENTER — FIRST-LIEN SENIOR LOAN
Transaction type: New origination of a first-lien, senior secured loan on a stabilized asset.
Borrower: Gateway Industrial Holdings LP.
Property: 412,000 square foot Class A distribution / logistics facility, Phoenix, Arizona. Built 2021.
Tenant: single tenant, a national third-party logistics (3PL) operator, on a triple-net lease.
Loan amount: $31,000,000.
Term: 5 years, amortizing on a 30-year schedule.
Interest rate: fixed 7.85%.
As-is appraised value: $44,500,000. Loan-to-value approximately 70%.
Strategy fit: stabilized, single-tenant net-lease industrial with long remaining lease term; first-lien capital preservation profile.`,
      },
      {
        type: "rent_roll",
        title: "Rent Roll",
        text: `GATEWAY LOGISTICS CENTER — RENT ROLL
Tenant: National 3PL operator (investment-grade parent guarantee).
Leased area: 412,000 sf. Occupancy: 100%.
Lease type: absolute triple-net (NNN).
Base rent: $7.95 / sf / year = $3,275,400 annual base rent.
Annual rent escalations: 3.0% fixed.
Weighted average lease term (WALT) remaining: 8.2 years.
Concentration note: this is a SINGLE-TENANT asset — 100% of income derives from one tenant. Re-tenanting risk is concentrated at lease expiry.`,
      },
      {
        type: "appraisal",
        title: "Appraisal Report",
        text: `GATEWAY LOGISTICS CENTER — APPRAISAL SUMMARY
As-is market value: $44,500,000.
Net operating income (NOI): $3,050,000.
Capitalization rate: 6.85%.
Value per square foot: $108/sf, below replacement cost of approximately $135/sf.
The Phoenix industrial market vacancy is 4.1% with strong tenant demand along the I-10 corridor.
Dark value (value if tenant vacated, re-leasing at market): estimated $37,000,000.`,
      },
      {
        type: "borrower_financials",
        title: "Borrower Financial Statements",
        text: `GATEWAY INDUSTRIAL HOLDINGS LP — SPONSOR SUMMARY
Net worth: $88,000,000. Liquidity: $14,500,000.
Portfolio: 6 industrial assets totaling 2.3 million sf, weighted-average occupancy 98%.
The single tenant's parent carries an investment-grade credit rating and provides a corporate guarantee of the lease.
Property operating statement: base rent $3,275,400; expense reimbursements (NNN) cover operating costs; net operating income $3,050,000.
No prior defaults. Sponsor has held two prior loans with the firm, both repaid in full.`,
      },
      {
        type: "loan_agreement",
        title: "Loan Agreement",
        text: `GATEWAY LOGISTICS — KEY LOAN TERMS
Lien position: first-lien, senior secured.
Annual debt service (7.85% fixed, 30-year amortization on $31,000,000): approximately $2,690,000.
Debt yield at close (NOI / loan amount): 9.84%.
Covenants: minimum DSCR 1.10x tested quarterly; cash sweep if WALT falls below 3.0 years or DSCR below 1.05x.
Lease-related: full cash sweep commences 12 months prior to lease expiration if the tenant has not renewed.
Reserves: $900,000 TI/LC reserve; tax and insurance escrows.
Recourse: non-recourse with carve-outs.`,
      },
    ],
  },
  {
    id: "palmetto-point",
    name: "Palmetto Point Retail (NPL)",
    subtitle: "98,000 sf anchored retail strip, Tampa FL",
    category: "Bluepine Credit Fund IV",
    status: "screening",
    docs: [
      {
        type: "offering_memo",
        title: "Offering Memorandum",
        text: `PALMETTO POINT RETAIL — NON-PERFORMING LOAN ACQUISITION
Transaction type: Acquisition of an existing first-lien mortgage note (non-performing).
Note status: the underlying loan has MATURED and is in monetary default; the borrower failed to repay at the maturity date.
Unpaid principal balance (UPB) of the note: $12,750,000.
Acquisition price (note purchase): $9,950,000 — a 78% of par purchase basis.
Collateral: 98,000 sf grocery-anchored retail center, Tampa, Florida. Built 2004.
As-is appraised value of collateral: $14,200,000.
LTV on UPB: approximately 90%. LTV on our purchase basis: approximately 70%.
Strategy: distressed-debt acquisition consistent with the firm's history of acquiring non-performing loans on a deal-by-deal basis. Loan-to-own / restructuring optionality with a discounted basis providing downside protection.`,
      },
      {
        type: "rent_roll",
        title: "Rent Roll",
        text: `PALMETTO POINT RETAIL — RENT ROLL
Gross leasable area: 98,000 sf. Occupancy: 76%.
Anchor: the 42,000 sf grocery anchor VACATED at lease expiration 7 months ago — currently dark. This is the primary driver of the default.
In-line tenants: 23 occupied suites, average rent $22.50/sf, mix of national and local credit.
Weighted average lease term remaining (in-line): 3.4 years.
Annual in-place base rent: $1,560,000.
The vacant anchor box represents a significant lease-up and re-tenanting opportunity; backfill discussions are referenced in the broker materials.`,
      },
      {
        type: "appraisal",
        title: "Appraisal Report",
        text: `PALMETTO POINT RETAIL — APPRAISAL SUMMARY
As-is market value (with anchor dark): $14,200,000.
As-stabilized value (anchor backfilled, 93% occupancy): $19,800,000.
In-place net operating income (NOI): $1,180,000.
Stabilized NOI estimate: $1,720,000.
Capitalization rate: 8.30% (reflecting the dark anchor and retail risk premium).
Land and improvements replacement cost: $21,000,000.
The Tampa retail submarket has 6.4% vacancy; grocery-anchored centers remain in demand, supporting a backfill thesis.`,
      },
      {
        type: "borrower_financials",
        title: "Borrower / Collateral Financials",
        text: `PALMETTO POINT — UNDERLYING BORROWER & COLLATERAL CASH FLOW
Underlying borrower: Palmetto Point Center LLC (the defaulted obligor on the note we are acquiring).
Borrower is in default; no current sponsor guarantee support is assumed in the base case.
Collateral operating statement (trailing 12 months): effective gross income $1,790,000; operating expenses $610,000; net operating income $1,180,000.
Existing loan annual debt service (note coupon 7.10% interest-only on $12,750,000 UPB plus default interest): approximately $1,240,000.
The asset's in-place NOI does not cover existing debt service — the loan is non-performing.`,
      },
      {
        type: "loan_agreement",
        title: "Existing Note & Loan Documents",
        text: `PALMETTO POINT — EXISTING NOTE SUMMARY (loan being acquired)
Lien position of the note: first-lien, senior secured.
Original loan amount: $13,500,000. Current UPB: $12,750,000.
Status: matured and in monetary default; default interest accruing.
Note coupon: 7.10%. Existing annual debt service: approximately $1,240,000.
Maturity: the loan has already matured (past due).
Our position: as first-lien noteholder at a $9,950,000 basis, we control the foreclosure / restructuring process.
Workout optionality: (1) negotiated payoff/refinance by borrower, (2) discounted payoff, (3) deed-in-lieu or foreclosure to take title, then backfill the anchor and stabilize.
Downside protection derives from the discounted purchase basis relative to as-is collateral value.`,
      },
    ],
  },
];
