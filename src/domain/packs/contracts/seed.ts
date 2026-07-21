import type { SeedRecord } from "../../types";

/**
 * Commercial-contracts review example domain — synthetic seed data.
 *
 * Entirely fictional — invented company names, no real agreements — modeled on
 * an in-house legal team's mixed book: contracts where we are the customer, the
 * vendor, and the buyer. Dates and figures are internally consistent so the
 * renewal-deadline, days-until, and liability-cap-ratio tools compute cleanly.
 *
 * A new domain replaces this array with its own synthetic records + documents.
 * `subtitle` = the one-liner under the name; `category` = the counterparty bucket.
 */
export const contractsSeed: SeedRecord[] = [
  {
    id: "northbeam-analytics",
    name: "Northbeam Analytics Subscription",
    subtitle: "Inbound SaaS analytics platform — we are the customer",
    category: "Vendor — Software",
    status: "review",
    docs: [
      {
        type: "agreement_summary",
        title: "Subscription Agreement Summary",
        text: `NORTHBEAM ANALYTICS — SOFTWARE SUBSCRIPTION AGREEMENT
Our role: Customer (subscriber). Counterparty / Vendor: Northbeam Analytics Inc.
Product: Northbeam cloud analytics platform, delivered as a hosted SaaS service.

Term: initial term of 12 months, effective 2026-04-01 and ending 2027-03-31.
Auto-renewal: this agreement AUTOMATICALLY RENEWS for successive 12-month terms unless either party gives written notice of non-renewal at least 60 days before the end of the then-current term. Missing that window locks us into another full 12-month term.
Fees: $240,000 per year, invoiced annually in advance, net 30.
Renewal pricing: on each renewal the vendor may increase fees by up to 7%.
Limitation of liability: each party's aggregate liability is capped at the fees paid in the 12 months preceding the claim — i.e. 1x annual fees, currently $240,000. There are no uncapped carve-outs in this vendor form.
Termination: for convenience only at term end via the non-renewal notice above; for cause on 30 days' written notice of an uncured material breach.
Governing law: Delaware. A data processing addendum is incorporated by reference.`,
      },
      {
        type: "order_form",
        title: "Order Form",
        text: `NORTHBEAM ANALYTICS — ORDER FORM
Subscriber: our company. Provider: Northbeam Analytics Inc.
Subscription tier: Growth. Licensed seats: 250.
Annual subscription fee: $240,000 (USD), billed annually in advance.
Term start: 2026-04-01. Term end: 2027-03-31. Initial term length: 12 months.
Payment terms: net 30 from invoice date.
Auto-renewal: yes — successive 12-month terms unless written non-renewal notice is given at least 60 days before term end (see Subscription Agreement Summary).
Included: platform access for 250 named users, standard support, 99.9% uptime SLA.
Overage: additional seats billed at $960 per seat per year, pro-rated.
This Order Form is governed by and incorporates the Subscription Agreement.`,
      },
      {
        type: "renewal_memo",
        title: "Renewal Memo",
        text: `NORTHBEAM ANALYTICS — INTERNAL RENEWAL MEMO
Purpose: flag the upcoming renewal decision and the auto-renewal trap.
Key dates: the term ends 2027-03-31. Non-renewal notice must be given at least 60 days before term end. The last day we can give notice of non-renewal is therefore 2027-01-30.
Risk: if we do not give notice by 2027-01-30, the agreement auto-renews for another 12 months at up to a 7% price increase — roughly $256,800 for the renewal year.
Usage: telemetry shows we are consistently using about 180 of the 250 licensed seats, so we are over-provisioned and have leverage to right-size or renegotiate at renewal.
Recommendation: make the renew / renegotiate / exit decision by mid-January 2027 and, if exiting or resizing, serve written notice before the 2027-01-30 deadline. A calendar reminder has been set for 2027-01-10.`,
      },
      {
        type: "redline_notes",
        title: "Negotiation Notes",
        text: `NORTHBEAM ANALYTICS — NEGOTIATION NOTES (initial signing)
Notice window: we asked for a 30-day non-renewal notice window; the vendor held firm at 60 days. Accepted, with an internal calendar control to protect the deadline.
Auto-renewal: we asked to strike the automatic-renewal mechanic entirely in favor of an affirmative opt-in. Vendor declined; the evergreen auto-renewal stayed in.
Price protection: we secured a cap of 7% on renewal price increases (vendor's opening position had no cap).
Liability: the 1x-fees liability cap was mutual and accepted without change; there are no uncapped carve-outs in this form.
Open follow-ups for renewal: push again for opt-in renewal, seek a lower renewal-increase cap, and right-size seat count based on actual usage.`,
      },
    ],
  },
  {
    id: "veldt-logistics",
    name: "Veldt Logistics MSA",
    subtitle: "Outbound enterprise platform license — we are the vendor",
    category: "Customer — Enterprise",
    status: "negotiation",
    docs: [
      {
        type: "agreement_summary",
        title: "Master Services Agreement Summary",
        text: `VELDT LOGISTICS — MASTER SERVICES AGREEMENT (MSA) SUMMARY
Our role: Vendor / service provider. Counterparty / Customer: Veldt Logistics Corp.
Scope: enterprise license to our platform plus implementation and support services.
Annual contract value (fees): $1,200,000 per year. Proposed term: 24 months from 2026-09-01.
Limitation of liability: the current draft caps each party's aggregate liability at the fees paid in the trailing 12 months — i.e. 1x annual fees, or $1,200,000.
Uncapped carve-outs: liability for breaches of confidentiality, infringement of intellectual property rights, and a party's indemnification obligations is EXCLUDED from the cap (uncapped) in both drafts.
Status: this is the actively negotiated liability position. The customer is pushing to raise the general cap; see the Negotiation Notes and Proposed Amendment.
Termination: for convenience on 90 days' notice after month 12; for cause on 30 days' notice of an uncured material breach.
Governing law: New York.`,
      },
      {
        type: "order_form",
        title: "Order Form / SOW",
        text: `VELDT LOGISTICS — ORDER FORM AND STATEMENT OF WORK
Provider: our company. Customer: Veldt Logistics Corp.
Annual fees: $1,200,000 (USD), invoiced quarterly in advance at $300,000 per quarter.
Term start (proposed): 2026-09-01. Term length: 24 months.
Scope of services: enterprise platform license for up to 5,000 users, a phased implementation over the first 90 days, integration support, and a dedicated customer success manager.
Service levels: 99.9% uptime, priority support with a 4-hour response target for critical issues.
Payment terms: net 45.
Fees are exclusive of taxes. This Order Form is governed by the Master Services Agreement.`,
      },
      {
        type: "redline_notes",
        title: "Negotiation Notes",
        text: `VELDT LOGISTICS — NEGOTIATION NOTES (liability cap)
Central dispute: the limitation-of-liability cap. Our draft sets the general cap at 1x trailing annual fees ($1,200,000). Veldt has redlined this and is pushing for a cap of 3x annual fees ($3,600,000).
Our position: hold at 1x fees; authorized fallback is 1.5x fees ($1,800,000) if needed to close, but not higher.
Carve-outs: both drafts keep confidentiality breaches, IP infringement, and indemnification obligations uncapped. Veldt is separately asking to ADD data-breach / security-incident liability to the uncapped carve-outs — we are resisting this and proposing instead a super-cap of 2x fees specifically for data-breach claims.
Rationale: at $1.2M annual value, a 3x general cap ($3.6M) is above our standard risk tolerance for this deal size; 1x–1.5x is consistent with how we price this product.
Next step: circulate the Proposed Amendment reflecting the 1x current / 3x requested positions for the deal desk to review.`,
      },
      {
        type: "amendment",
        title: "Proposed Amendment",
        text: `VELDT LOGISTICS — PROPOSED AMENDMENT TO SECTION 11 (LIMITATION OF LIABILITY)
This amendment records the two open positions on the general liability cap so the deal desk can decide.
Current (our draft): "each party's total aggregate liability shall not exceed the fees paid or payable in the twelve (12) months preceding the event giving rise to the claim" — i.e. a cap of 1x annual fees ($1,200,000).
Requested (Veldt's redline): replace "twelve (12) months" multiple with three times the trailing twelve months' fees — i.e. a cap of 3x annual fees ($3,600,000).
Unchanged in both versions: confidentiality breaches, IP infringement, and indemnification obligations remain uncapped carve-outs and are not subject to the general cap.
Fallback authority: the deal desk may agree up to 1.5x annual fees ($1,800,000) on the general cap without escalation. Anything above 1.5x requires GC sign-off.`,
      },
    ],
  },
  {
    id: "corvid-systems",
    name: "Corvid Systems Supply Agreement",
    subtitle: "Inbound component supply — we are the buyer",
    category: "Supplier — Manufacturing",
    status: "executed",
    docs: [
      {
        type: "agreement_summary",
        title: "Supply Agreement Summary",
        text: `CORVID SYSTEMS — COMPONENT SUPPLY AGREEMENT SUMMARY
Our role: Buyer. Counterparty / Supplier: Corvid Systems Ltd.
Scope: Corvid manufactures and supplies electronic control modules to us under a fixed annual purchase commitment.
Status: EXECUTED and in force. Original effective date 2024-01-01. Current term ends 2026-12-31.
Renewal: renews for successive 12-month terms unless either party gives written notice of non-renewal (or of intent to renegotiate pricing) at least 90 days before the term end. The last day to give that notice is 2026-10-02.
Price escalation: unit prices increase on each renewal by the lesser of the change in CPI or 4% — i.e. the annual increase is CAPPED AT 4%. Base unit price at execution (2024) was $18.50.
Volume commitment: minimum annual purchase of 50,000 units.
Limitation of liability: each party's liability is capped at the fees paid in the trailing 12 months; product-defect indemnity is uncapped.
Governing law: California.`,
      },
      {
        type: "order_form",
        title: "Pricing Schedule",
        text: `CORVID SYSTEMS — PRICING SCHEDULE
Product: electronic control module, part number CS-4400.
Base unit price (2024, at execution): $18.50 per unit.
Escalation mechanic: on each contract year the unit price increases by the lesser of CPI or 4%.
Applied schedule to date:
- 2024: $18.50 per unit (base).
- 2025: $19.24 per unit (4% escalation applied).
- 2026: $20.01 per unit (further 4% escalation applied).
Minimum annual purchase commitment: 50,000 units.
2026 committed spend at $20.01 per unit x 50,000 units = approximately $1,000,500.
Payment terms: net 45. Freight: FOB supplier's dock. This schedule is governed by the Supply Agreement.`,
      },
      {
        type: "amendment",
        title: "Price Escalation Amendment",
        text: `CORVID SYSTEMS — AMENDMENT NO. 1 (PRICE ESCALATION CAP)
Effective 2025-01-01, the parties amended the pricing clause of the Supply Agreement to confirm the annual escalation mechanic.
Agreed language: "the per-unit price shall increase on each contract anniversary by the lesser of (a) the year-over-year change in the Consumer Price Index or (b) four percent (4%)." The 4% ceiling is a hard cap on any single year's increase.
This amendment does not change the term end date (2026-12-31), the 90-day non-renewal / renegotiation notice requirement, or the 50,000-unit minimum annual purchase commitment.
All other terms of the Supply Agreement remain in full force and effect.`,
      },
      {
        type: "renewal_memo",
        title: "Renewal Decision Memo",
        text: `CORVID SYSTEMS — RENEWAL DECISION MEMO
Purpose: decide whether to renew, renegotiate, or exit the Corvid supply agreement before the notice deadline.
Key dates: the current term ends 2026-12-31. Written non-renewal or renegotiation notice is due at least 90 days before term end, so the deadline to act is 2026-10-02.
If we take no action: the agreement auto-renews for another 12 months and the 2027 unit price escalates by up to 4%, from $20.01 to approximately $20.81 per unit — roughly $1,040,500 in committed spend at the 50,000-unit minimum.
Options: (1) renew as-is; (2) serve a renegotiation notice by 2026-10-02 to reopen unit pricing and volume commitment; (3) exit and move to an alternate supplier currently being qualified.
Recommendation: decide by late September 2026 and, if renegotiating or exiting, serve written notice before the 2026-10-02 deadline. A reminder has been set for 2026-09-18.`,
      },
    ],
  },
];
