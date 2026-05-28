/**
 * Hand-tuned NL question pattern matcher for the scripted AI.
 *
 * Each entry: a key, a list of "patterns" (lowercased token bags), and the
 * canonical response. We match by token-overlap with a stopword strip.
 * Fallback returns 4 helpful suggestion chips, never an error.
 */

import type { AnswerResult, Citation } from "./engine";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "of", "in", "on", "at", "to", "from", "with",
  "for", "and", "or", "but", "by", "as", "this", "that", "these", "those",
  "i", "you", "we", "they", "he", "she", "it", "me", "my", "our", "your",
  "show", "tell", "give", "find", "list", "what", "which", "who", "whose",
  "when", "where", "why", "how", "many", "much",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s₹%-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

function overlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  let hits = 0;
  for (const t of b) if (setA.has(t)) hits++;
  return hits / Math.max(b.length, 1);
}

interface QuestionPattern {
  key: string;
  patterns: string[];
  answer: () => Promise<AnswerResult>;
}

// Helpers to build canned answers without a DB hit. Real numbers come from
// the response strings themselves (the demo data is seeded to match).
function answer(
  key: string,
  message: string,
  citations: Citation[],
  followUps: string[],
): AnswerResult {
  return { matchedKey: key, message, citations, suggestedFollowUps: followUps };
}

export const QUESTION_PATTERNS: QuestionPattern[] = [
  {
    key: "q.salary-aarav",
    patterns: [
      "why aarav mehta salary double",
      "aarav mehta salary doubled",
      "emp 0142 salary",
      "aarav salary spike",
      "salary doubled april",
    ],
    answer: async () =>
      answer(
        "q.salary-aarav",
        "EMP-0142 (Aarav Mehta) was paid ₹2,04,800 in Apr 2026 — exactly 2× his 12-month median of ₹1,02,400. A CORRECTION run on 2026-04-28 reprocessed the same line as the REGULAR run on 2026-04-25 without offsetting. This is a duplicate net-pay event, not a real raise.",
        [
          { type: "Employee", id: "EMP-0142", label: "EMP-0142" },
          { type: "Cycle", id: "2026-04", label: "Apr 2026" },
        ],
        [
          "Show the two runs side by side",
          "How do I reverse the CORRECTION line?",
          "Are there other duplicate runs this cycle?",
        ],
      ),
  },
  {
    key: "q.payroll-anomalies",
    patterns: [
      "show anomalies payroll",
      "payroll anomalies",
      "salary issues",
      "payroll problems april",
    ],
    answer: async () =>
      answer(
        "q.payroll-anomalies",
        "4 open payroll anomalies in Apr 2026 — 1 critical (EMP-0142 duplicate run), 1 high (EMP-0317 spike +174%), 1 high (EMP-0205 missing PF ₹8,160), 1 medium (EMP-0481 unprorated joining 19 Apr).",
        [
          { type: "Cycle", id: "2026-04", label: "Apr 2026" },
        ],
        [
          "Open the EMP-0142 anomaly",
          "Show EMP-0317's 18-month chart",
          "List employees missing statutory deductions",
        ],
      ),
  },
  {
    key: "q.vendor-most-expensive",
    patterns: [
      "most expensive vendor",
      "biggest vendor spend",
      "top vendors quarter",
      "largest vendor",
    ],
    answer: async () =>
      answer(
        "q.vendor-most-expensive",
        "Top vendors by Q1-Q2 spend: 1) DataDrive Hardware (VEN-014) — ₹38.4 L; 2) Bharat Logistics (VEN-022) — ₹22.1 L; 3) NorthStar Office Supplies (VEN-008) — ₹14.8 L. DataDrive has a 17% unit-price drift flagged on its last two invoices.",
        [
          { type: "Vendor", id: "VEN-014", label: "VEN-014" },
          { type: "Vendor", id: "VEN-022", label: "VEN-022" },
          { type: "Vendor", id: "VEN-008", label: "VEN-008" },
        ],
        [
          "Show DataDrive's invoice history",
          "Compare DataDrive vs Bharat Logistics",
          "Which vendors are off-contract?",
        ],
      ),
  },
  {
    key: "q.vendor-anomalies",
    patterns: [
      "show anomalies vendor",
      "vendor invoice issues",
      "vendor problems",
      "invoice anomalies",
    ],
    answer: async () =>
      answer(
        "q.vendor-anomalies",
        "6 open vendor anomalies — 1 missing-line (Bharat Logistics, ₹64,500 gap), 1 duplicate (NorthStar, ₹1.84 L), 1 price drift (DataDrive Dell laptops, +17%), 1 deduction reflection mismatch (Kaveri TDS 2% vs contract 1%), 1 inconsistent GST (Sahyadri 12% on a SaaS SKU), 1 invalid GSTIN (Madhuri Catering checksum fail).",
        [
          { type: "Vendor", id: "VEN-022", label: "VEN-022" },
          { type: "Vendor", id: "VEN-008", label: "VEN-008" },
          { type: "Vendor", id: "VEN-014", label: "VEN-014" },
        ],
        [
          "Open Bharat Logistics missing-line anomaly",
          "Show NorthStar duplicate invoice",
          "Why does Kaveri's TDS not match?",
        ],
      ),
  },
  {
    key: "q.laptops-spend",
    patterns: [
      "spend laptops april",
      "laptops cost april",
      "laptops spending",
      "how much laptops",
    ],
    answer: async () =>
      answer(
        "q.laptops-spend",
        "Laptops category in Apr 2026 was ₹14,80,000 — 131% above the trailing 6-month average of ₹6,40,000. Three large purchases on 2026-04-09 (10 × Dell Latitude 5440 @ ₹93,200), 2026-04-15 (5 × MacBook Air M3 @ ₹1,28,500), and 2026-04-22 (3 × Lenovo ThinkPad P14s @ ₹1,18,000) drove the jump.",
        [
          { type: "Category", id: "CAT-LAPTOPS", label: "Laptops" },
          { type: "Vendor", id: "VEN-014", label: "VEN-014" },
        ],
        [
          "Was April hiring above plan?",
          "Compare laptops vs furniture spend",
          "Show DataDrive's price-drift flag",
        ],
      ),
  },
  {
    key: "q.food-tomatoes",
    patterns: [
      "food costs",
      "vegetables price",
      "tomato price",
      "annapurna mart",
      "pantry spend",
    ],
    answer: async () =>
      answer(
        "q.food-tomatoes",
        "Vegetables & Pantry spend held steady at ₹6.2 L in Apr 2026 — but the unit price of tomatoes from Annapurna Mart (VEN-026) jumped from a 12-week median of ₹42/kg to ₹78/kg in the week of 2026-04-22 (+86%). Same SKU, same vendor.",
        [
          { type: "Vendor", id: "VEN-026", label: "VEN-026" },
          { type: "Category", id: "CAT-VEG", label: "Vegetables & Pantry" },
        ],
        [
          "Check market tomato price for that week",
          "Are other vegetables also up?",
          "Show 12-month vegetable spend trend",
        ],
      ),
  },
  {
    key: "q.april-everything",
    patterns: [
      "everything wrong april",
      "summary april",
      "april 2026 overview",
      "show all anomalies",
      "april issues",
    ],
    answer: async () =>
      answer(
        "q.april-everything",
        "Apr 2026 has 15 open anomalies. Payroll: EMP-0142 duplicate net pay (₹2,04,800), EMP-0317 unjustified +174% spike, EMP-0205 missing ₹8,160 PF, EMP-0481 unprorated. Vendors: Bharat Logistics missing line, NorthStar duplicate, DataDrive +17% price drift, Kaveri TDS reflection mismatch, Sahyadri tax inconsistent, Madhuri GSTIN invalid. Spend: Laptops +131%, tomatoes +86%, off-contract catering ₹1.18 L, split purchase pattern, duplicate procurement entry. Largest by impact: laptops category and the duplicate net pay.",
        [
          { type: "Cycle", id: "2026-04", label: "Apr 2026" },
        ],
        [
          "Open the duplicate net-pay anomaly",
          "Show the laptops category drill-down",
          "Run cycle close-out checklist",
        ],
      ),
  },
  {
    key: "q.off-contract",
    patterns: [
      "off contract purchase",
      "unapproved vendor",
      "vendor not on panel",
      "non panel vendor",
    ],
    answer: async () =>
      answer(
        "q.off-contract",
        "One off-contract purchase in Apr 2026: ₹1,18,500 catering on 2026-04-12 booked to Tasty Bites Express (VEN-040), which is not on the approved catering panel (VEN-019, VEN-033).",
        [
          { type: "Vendor", id: "VEN-040", label: "VEN-040" },
          { type: "Category", id: "CAT-CATERING", label: "Conference Catering" },
        ],
        ["Who approved it?", "Add Tasty Bites to the panel"],
      ),
  },
  {
    key: "q.split-purchase",
    patterns: [
      "split purchase",
      "threshold avoidance",
      "po splitting",
      "under 50000 pos",
    ],
    answer: async () =>
      answer(
        "q.split-purchase",
        "Three POs to NorthStar Office Supplies (VEN-008) in 9 days — ₹49,500, ₹49,820, ₹49,900 — all just under the ₹50,000 single-approver threshold (aggregate ₹1,48,800). Pattern signals threshold avoidance.",
        [{ type: "Vendor", id: "VEN-008", label: "VEN-008" }],
        ["Show all three POs", "Who raised them?"],
      ),
  },
];

const FALLBACK_FOLLOWUPS = [
  "Show me anomalies in payroll",
  "How much did we spend on laptops in April?",
  "Which vendors have invoice issues?",
  "What's the most expensive vendor this quarter?",
];

/**
 * Match a question against the patterns. Returns the best match if overlap
 * is above 0.35, otherwise a graceful fallback with 4 chips.
 */
export async function matchAndAnswer(question: string): Promise<AnswerResult> {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) {
    return {
      message:
        "I'm focused on payroll, vendors, and external spend. Try one of these:",
      citations: [],
      suggestedFollowUps: FALLBACK_FOLLOWUPS,
    };
  }

  let best: { pattern: QuestionPattern; score: number } | null = null;
  for (const p of QUESTION_PATTERNS) {
    for (const pat of p.patterns) {
      const score = overlap(qTokens, tokenize(pat));
      if (score > 0 && (!best || score > best.score)) {
        best = { pattern: p, score };
      }
    }
  }

  if (best && best.score >= 0.35) {
    return best.pattern.answer();
  }

  return {
    message:
      "I can answer about payroll runs, vendor invoices, and procurement spend. Try one of these:",
    citations: [],
    suggestedFollowUps: FALLBACK_FOLLOWUPS,
  };
}
