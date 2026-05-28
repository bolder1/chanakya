/**
 * Scripted AI response registry.
 *
 * Each key matches a planted anomaly's `scriptedResponseKey` (see the 15 in
 * BUILD_PLAN.md). The engine looks up the response by key — no inference,
 * no LLM call, just a typed registry.
 *
 * To add a new anomaly, plant it in seed/anomalies.ts AND register here.
 */

import type { Citation } from "./engine";

export interface ScriptedResponse {
  narrative: string;
  citations: Citation[];
  confidence: 1 | 2 | 3 | 4 | 5;
  followUps: string[];
}

export const SCRIPTED_RESPONSES: Record<string, ScriptedResponse> = {
  // ------------------------------------------------------------------------
  // Payroll
  // ------------------------------------------------------------------------
  "pay.duplicate-net-run": {
    narrative:
      "EMP-0142 (Aarav Mehta) shows ₹2,04,800 net in Apr 2026 — exactly 2× the 12-month median of ₹1,02,400. A CORRECTION run on 2026-04-28 reprocessed the same line as the REGULAR run on 2026-04-25 without offsetting. Recommend reversing the CORRECTION line and re-running export.",
    citations: [
      { type: "Employee", id: "EMP-0142", label: "EMP-0142" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: [
      "Show the two runs side by side",
      "Reverse the CORRECTION line",
      "Who approved the CORRECTION run?",
    ],
  },
  "pay.spike-unjustified": {
    narrative:
      "EMP-0317 (Diya Iyer, AE — IAM Sales) net spiked 174% vs trailing-12 median. The increment lives in specialAllowPaise, not bonusPaise, and no revision letter is on file. Likely misclassified bonus or test-data leak.",
    citations: [
      { type: "Employee", id: "EMP-0317", label: "EMP-0317" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 4,
    followUps: [
      "Show EMP-0317's 18-month chart",
      "List all special-allowance changes this cycle",
    ],
  },
  "pay.statutory-pf-missing": {
    narrative:
      "EMP-0205 (Rohan Pillai) has ₹0 in the Provident Fund column on a ₹68,000 BASIC. Expected ₹8,160 at the 12% statutory rate. Either the UAN is mis-mapped or the run skipped the PF policy. PROF TAX (₹200) is present, so the cycle ran — only PF was dropped.",
    citations: [
      { type: "Employee", id: "EMP-0205", label: "EMP-0205" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: [
      "Check UAN mapping for EMP-0205",
      "List other employees missing PF this cycle",
    ],
  },
  "pay.net-formula-broken": {
    narrative:
      "EMP-0091 (Karthik Nair) salary sheet shows GROSS ₹1,18,400, TOTAL DEDUCTIONS ₹14,820, but NET PAY ₹1,01,580 — that is ₹2,000 short of (GROSS − TOTAL DEDUCTIONS). The salary sheet's NET PAY formula was overridden or hand-typed.",
    citations: [
      { type: "Employee", id: "EMP-0091", label: "EMP-0091" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: ["Show the row", "Recompute NET from formula"],
  },
  "pay.new-hire-no-proration": {
    narrative:
      "EMP-0481 (Shreya Banerjee) DOJ is 2026-04-19 yet the attendance sheet shows PRESENT DAYS = 30 / 30 and the salary sheet pays a full month (BASIC ₹72,000). Pro-rated expectation is 12 days = ₹28,800. The attendance file's DOJ column is set; the salary calculation didn't honour it.",
    citations: [
      { type: "Employee", id: "EMP-0481", label: "EMP-0481" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: ["Show all April joiners", "Apply correct proration"],
  },

  // ------------------------------------------------------------------------
  // Attendance + LWP
  // ------------------------------------------------------------------------
  "att.lwp-not-reflected": {
    narrative:
      "EMP-0226 (Priyanka Joshi) attendance sheet shows 4 LWP days in Apr 2026 but the salary sheet's PRESENT DAYS reads 30/30. BASIC and HRA are paid in full; expected pro-ration is (26/30) × ₹86,000 = ₹74,533, a ₹11,467 over-payment. The attendance → salary handoff dropped LWP.",
    citations: [
      { type: "Employee", id: "EMP-0226", label: "EMP-0226" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: [
      "Show all employees with LWP this cycle",
      "Apply LWP to the salary recompute",
    ],
  },
  "att.exit-paid-full-month": {
    narrative:
      "EMP-0117 (Anand Krishnan) attendance sheet has LWD = 2026-04-14 but the salary sheet pays a full 30/30 (GROSS ₹1,42,000). Pro-rated expectation through LWD is 14 days = ₹66,266.",
    citations: [
      { type: "Employee", id: "EMP-0117", label: "EMP-0117" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: ["Find all April exits", "Recompute final settlement"],
  },

  // ------------------------------------------------------------------------
  // Shift allowance
  // ------------------------------------------------------------------------
  "shift.days-no-allowance": {
    narrative:
      "EMP-0408 (Meera Subramanian) shift sheet records 6 Night Shift From Office days and 2 Weekend Shift days in Apr 2026, but the salary sheet's SHIFT ALLOWANCE column reads ₹0. At the standard ₹650/night + ₹400/weekend policy, the expected allowance is ₹4,700.",
    citations: [
      { type: "Employee", id: "EMP-0408", label: "EMP-0408" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 4,
    followUps: [
      "Show all employees with shift days but no allowance",
      "Open the shift policy",
    ],
  },

  // ------------------------------------------------------------------------
  // Hostel / Guest house
  // ------------------------------------------------------------------------
  "hostel.total-mismatch": {
    narrative:
      "Hostel sheet for EMP-0349 (Vikram Choudhary, Pune GH-2 / Flat 304) shows Accommodation ₹6,000 + Maintenance ₹500 + Food ₹4,200 + Transport ₹0 + Electricity ₹820 + Internet ₹350 = ₹11,870. The TOTAL column reads ₹12,870 — a ₹1,000 difference, likely a hand-typed override.",
    citations: [
      { type: "Employee", id: "EMP-0349", label: "EMP-0349" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: ["Open the row", "Recompute TOTAL"],
  },
  "hostel.payroll-mismatch": {
    narrative:
      "Hostel sheet rolls up to ₹11,870 for EMP-0349 in Apr 2026, but the salary sheet's GUEST HOUSE/OTHER DEDUCTION column reads ₹14,000 — a ₹2,130 over-deduction the employee will flag. The hostel-to-payroll handoff used a stale value.",
    citations: [
      { type: "Employee", id: "EMP-0349", label: "EMP-0349" },
      { type: "Cycle", id: "2026-04", label: "Apr 2026" },
    ],
    confidence: 5,
    followUps: [
      "Show both sheet rows",
      "Refund the over-deduction",
      "Find similar mismatches",
    ],
  },

  // ------------------------------------------------------------------------
  // Vendor invoices
  // ------------------------------------------------------------------------
  "inv.missing-lines": {
    narrative:
      "Invoice INV-2026-04-119 from Bharat Logistics totals ₹4,82,000 in the header but the line items sum to ₹4,17,500. The missing line — 'Last-mile delivery — Pune, ₹64,500' — exists on PO-2026-0419. Header was likely re-typed without the line. Reflection on the deduction side: the same ₹64,500 appears as an unrecouped advance on AP ledger.",
    citations: [
      { type: "Invoice", id: "INV-2026-04-119", label: "INV-…04-119" },
      { type: "Vendor", id: "VEN-022", label: "VEN-022" },
    ],
    confidence: 5,
    followUps: [
      "Open the matched PO PO-2026-0419",
      "View the AP ledger entry",
      "Send dispute to Bharat Logistics",
    ],
  },
  "inv.duplicate": {
    narrative:
      "NorthStar Office Supplies submitted two invoices with identical line items totalling ₹1,84,250 within 36 hours: NS/2026/0411 and NS/2026/0411-A. Match score 100% on lines, 98% on totals. Likely a duplicate submission, not a re-bill.",
    citations: [
      { type: "Invoice", id: "NS/2026/0411", label: "NS/2026/0411" },
      { type: "Invoice", id: "NS/2026/0411-A", label: "NS/2026/0411-A" },
      { type: "Vendor", id: "VEN-008", label: "VEN-008" },
    ],
    confidence: 5,
    followUps: ["Reject the duplicate", "Show full NorthStar invoice history"],
  },
  "inv.price-drift": {
    narrative:
      "DataDrive Hardware's unit price for the Dell Latitude 5440 rose from a 6-month median of ₹78,200 to ₹91,500–₹93,200 (+17–19%) on the last two invoices. No PO amendment is on file.",
    citations: [
      { type: "Vendor", id: "VEN-014", label: "VEN-014" },
    ],
    confidence: 4,
    followUps: ["Compare against contract", "Request PO amendment"],
  },
  "inv.deduction-mismatch": {
    narrative:
      "Kaveri Travel House's invoice INV-KTH-04-31 shows TDS deducted at 2% (₹40,000). Contract terms specify 1% (₹20,000). The deduction reflected against this vendor in the ledger is ₹20,000 — a ₹20,000 mismatch the vendor will likely chase as a short payment.",
    citations: [
      { type: "Invoice", id: "INV-KTH-04-31", label: "INV-KTH-04-31" },
      { type: "Vendor", id: "VEN-031", label: "VEN-031" },
    ],
    confidence: 4,
    followUps: ["Open vendor contract", "Show ledger reconciliation"],
  },
  "inv.tax-inconsistent": {
    narrative:
      "Invoice INV-ST-2026-77 mixes 18% and 12% GST on five lines that are all the same SaaS subscription SKU. 12% is not a valid rate for this SAC code.",
    citations: [
      { type: "Invoice", id: "INV-ST-2026-77", label: "INV-ST-2026-77" },
      { type: "Vendor", id: "VEN-007", label: "VEN-007" },
    ],
    confidence: 5,
    followUps: ["Send dispute on the 12% line"],
  },
  "inv.gst-invalid": {
    narrative:
      "Vendor Madhuri Catering's GSTIN `27AAACM1234X1ZZ` fails the standard checksum. Either the GSTIN was mistyped on the invoice or the vendor is using a stale identifier.",
    citations: [{ type: "Vendor", id: "VEN-019", label: "VEN-019" }],
    confidence: 5,
    followUps: ["Request updated GSTIN", "Hold next payment until verified"],
  },

  // ------------------------------------------------------------------------
  // External spend
  // ------------------------------------------------------------------------
  "spend.category-variance-laptops": {
    narrative:
      "Laptops category spend in April 2026 hit ₹14,80,000 — 131% above the trailing 6-month average of ₹6,40,000. Three large purchases on 2026-04-09, 2026-04-15, 2026-04-22 drove the jump.",
    citations: [
      { type: "Category", id: "CAT-LAPTOPS", label: "Laptops" },
      { type: "Vendor", id: "VEN-014", label: "VEN-014" },
    ],
    confidence: 5,
    followUps: [
      "Show the three large purchases",
      "Was a hiring spike planned for April?",
    ],
  },
  "spend.unit-price-drift-veg": {
    narrative:
      "Tomatoes from Annapurna Mart jumped from a 12-week median of ₹42/kg to ₹78/kg in the week of 2026-04-22 (+86%). Same SKU, same vendor, no commentary on the invoice.",
    citations: [
      { type: "Vendor", id: "VEN-026", label: "VEN-026" },
      { type: "Category", id: "CAT-VEG", label: "Vegetables & Pantry" },
    ],
    confidence: 4,
    followUps: [
      "Compare with last week's tomato price",
      "Check market price index",
    ],
  },
  "spend.off-contract": {
    narrative:
      "A ₹1,18,500 catering charge on 2026-04-12 was booked against Tasty Bites Express (VEN-040), which is not on the approved catering panel (VEN-019, VEN-033). Off-contract purchase.",
    citations: [
      { type: "Vendor", id: "VEN-040", label: "VEN-040" },
      { type: "Category", id: "CAT-CATERING", label: "Conference Catering" },
    ],
    confidence: 5,
    followUps: ["Open the approved panel list", "Find the requester"],
  },
  "spend.split-purchase": {
    narrative:
      "Three POs to NorthStar Office Supplies in 9 days, each ₹49,500–₹49,900 — all just under the ₹50,000 single-approver threshold. Pattern indicates threshold-avoidance split purchase.",
    citations: [{ type: "Vendor", id: "VEN-008", label: "VEN-008" }],
    confidence: 4,
    followUps: [
      "Show all 3 POs",
      "List the requester(s)",
      "Escalate to Finance review",
    ],
  },
  "spend.dup-procurement-entry": {
    narrative:
      "Two procurement entries for 20 conference chairs at ₹62,400 each booked on 2026-04-17 against NorthStar (VEN-008). High likelihood of double-entry from CSV import.",
    citations: [{ type: "Vendor", id: "VEN-008", label: "VEN-008" }],
    confidence: 4,
    followUps: ["Open both entries", "Delete the duplicate"],
  },
};
