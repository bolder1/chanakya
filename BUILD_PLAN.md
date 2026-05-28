# Chanakya — Implementation Plan

**AI-powered payroll + financial/operational analytics for MiniOrange.**
Fresh repo. 6–8 weeks. Production-leaning prototype. Scripted AI behind a swappable interface.

---

## Context

You have a working PayOps Next.js app (Phase 0 done) at `C:\Users\Surajit\Documents\Claude\Projects\payops`. It looks like a product but the **AI is mocked and the data is sparse**, so when you stand in front of managers there's nothing to actually demo. You realised you'd over-invested in scaffolding before nailing the thing that has to feel magic: AI catching anomalies on real-looking data.

**Chanakya is the answer to that.** A fresh repo, same trustworthy stack, but designed from day 1 around four working end-to-end demo scenarios:

1. **Salary anomaly** — someone normally earning ₹1L gets ₹2L this month, AI catches it and explains why.
2. **Vendor invoice anomaly** — missing line items, duplicates, price drift, deduction–reflection mismatches.
3. **External spend variance** — laptops, vegetables, equipment — AI flags categories and transactions trending hot.
4. **Natural-language Q&A** — manager types a question, AI answers with citations and follow-ups.

The AI is **scripted** for V1: pre-baked responses keyed to data we plant deliberately. But the AI module is abstracted behind an `AIEngine` interface so swapping in Claude/OpenAI later is a one-line change. The prototype must look and feel real — Razorpay-style UI, multi-role login, 18 months of believable Indian payroll data, real Excel ingestion — so managers see a product, not a slideware demo.

Intended outcome: a runnable Next.js app, seeded with 486 employees / 40+ vendors / 1,500+ invoices / 15 pre-planted anomalies, that walks through all four scenarios in ≤22 minutes and survives free-typing in the chat box without breaking.

---

## Locked decisions

1. **Fresh repo** at `C:\Users\Surajit\Desktop\Kurukshatra\chanakya` (Kurukshatra is currently empty).
2. **All 4 demo scenarios** must work end-to-end.
3. **Scripted AI** for V1, abstracted behind `AIEngine` interface so LLM swap is trivial.
4. **6–8 week runway**, production-leaning quality.
5. **Multi-role real login** (NextAuth v5 beta): CFO/Finance, HR Ops, Vendor Manager, Operations Manager, Read-only Leadership, Sys Admin.
6. **Generated dummy data**: 486 employees × 18 months payroll, 40+ vendors, 1,500+ invoices, ~6,000 procurement entries, all Indian context, 15 anomalies pre-planted.
7. **All 4 integration stubs**: Excel upload (real), Zoho + Tally connectors (mocked), email-to-invoice ingestion (mocked inbox), WhatsApp/Slack alerts (mocked toasts).
8. **Razorpay-style visual identity**: deep navy `#0D2A4D` + saffron `#F59E0B`, dense data tables, JetBrains Mono for numbers, Archivo for UI.

---

## Tech stack

Same shape as PayOps so muscle memory transfers.

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js 16.2.x (App Router, RSC) | Server Actions for mutations |
| Language | TypeScript 5 strict | `noUncheckedIndexedAccess: true` |
| ORM | Prisma 7.8 + `@prisma/adapter-pg` | Datasource in `prisma.config.ts`, copy PayOps pattern |
| DB | Postgres 16 via **Supabase free tier** | Default — avoids Docker (memory: Docker Desktop is flaky on this box). `infra/docker-compose.yml` shipped as fallback. |
| Auth | NextAuth v5 beta (`5.0.0-beta.31`) + `@auth/prisma-adapter` | Credentials provider + bcrypt |
| UI | Tailwind v4 (`@theme` tokens) + shadcn/ui + lucide-react | Single icon family only |
| Charts | Recharts | Wrap in `'use client'` islands |
| Excel | SheetJS (`xlsx`) for parse, `exceljs` later for pretty writes | `cellDates: true` + INR comma stripping |
| Validation | Zod 4 | One schema per sheet + one per anomaly |
| Money | Integer paise (×100 on ingest) | Never floats |
| Testing | Vitest + Playwright | 4 Playwright specs = 4 scenarios |
| PM | pnpm | Same as PayOps |

---

## Repo structure (key folders)

```
chanakya/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── dashboard/, payroll/, vendors/, spend/, ask/,
│   │   ├── uploads/, integrations/, audit/, settings/
│   │   └── layout.tsx               # role-aware nav
│   └── api/{auth,uploads,ai/ask,connectors}/
├── components/
│   ├── ui/, chrome/, money/, kpi/, anomaly/, tables/,
│   ├── charts/, chat/, status/, upload/
├── lib/
│   ├── db.ts, auth.ts, format.ts, log.ts
│   ├── rbac/{capabilities,guards}.ts
│   ├── ai/
│   │   ├── engine.ts                # AIEngine interface (contract)
│   │   ├── scripted.ts              # V1 impl
│   │   ├── llm.ts                   # V2 stub (placeholder)
│   │   ├── responses.ts             # 15 narratives + ~30 Q&A patterns
│   │   ├── questions.ts             # NL pattern matcher
│   │   └── index.ts                 # factory (env-keyed)
│   ├── anomalies/{detector,types,seed-script}.ts
│   ├── excel/{parse,schemas,messy,templates/}
│   ├── payroll/, vendors/, spend/
│   ├── connectors/{zoho,tally,email-inbox,messaging}/  # all mocked
│   ├── audit/{log,shared}.ts
│   └── notifications/alerts.ts
├── prisma/{schema.prisma, seed.ts, migrations/}
├── seed/
│   ├── people.ts, payroll.ts, vendors.ts, procurement.ts,
│   ├── anomalies.ts                  # plants the 15
│   └── dictionaries/{firstNames.in,surnames.in,departments,vendorNames}.ts
├── data/templates/{payroll-input,vendor-invoices,procurement-spend}.xlsx
├── tests/{unit,e2e}/
├── infra/docker-compose.yml
├── PRODUCT.md, DESIGN.md, BUILD_PLAN.md, README.md
└── …configs
```

---

## Database schema (Prisma)

Money in **paise** (integer). Anomaly is polymorphic via **nullable scoped FKs** (one of `payrollLineId | invoiceLineId | procurementEntryId` is set per row) — keeps Prisma joins typed.

Key models:

- **User** (`role`: enum) — 6 seeded users + 3 extras
- **Cycle** — 18 months of `OPEN/LOCKED/CLOSED`
- **Employee** (`empId: "EMP-0001"`) — 486 employees with department, designation, location, manager, basic/CTC in paise
- **PayrollRun** + **PayrollLine** — `runType: REGULAR | BONUS | CORRECTION`; lines have basic, HRA, special, OT, bonus, gross, PF, ESI, PT, TDS, other_ded, net, days_payable, LOP
- **Vendor** (`code: "VEN-014"`) + **PurchaseOrder** + **PurchaseOrderLine** — 40 vendors, 50 POs
- **Invoice** + **InvoiceLine** — 1,500+ invoices; unique `(vendorId, invoiceNumber)`; `source: EMAIL | UPLOAD | PORTAL | MANUAL`
- **ProcurementCategory** (Laptops, Vegetables & Pantry, Office Equipment, Conference Catering, …) + **ProcurementEntry** — 6,000+ entries with unit/qty/unit_price/location
- **Anomaly** — `kind` enum (14 values across 4 scenarios), `severity`, `confidence (1–5)`, `status`, `narrative`, `scriptedResponseKey`, nullable target FKs, `raisedByEngine`
- **AuditEntry** — append-only, no updates; tracks every state change with before/after JSON
- **ExcelUpload** — `kind: PAYROLL | INVOICES | PROCUREMENT`, row/warning/error counts, status, summary
- **AIConversation** + **AIMessage** — chat persistence with citation chips
- **Connector** — slug, status, lastSync, lastError (mocked)
- **Notification** — kind, channel (`IN_APP | SLACK | WHATSAPP`), sentAt — powers "Sent to #finance" badges

Indices: `(role, active)`, `(runId, empId)`, `(vendorId, receivedOn)`, `(categoryId, occurredOn)`, `(kind, status)` on Anomaly, `(objectType, objectId)` on AuditEntry.

---

## The 15 pre-planted anomalies (the heart of the demo)

`seed/anomalies.ts` plants the data fingerprints. `lib/anomalies/detector.ts` finds them. `lib/ai/responses.ts` serves the narratives.

| # | `scriptedResponseKey` | Kind | Target | Planted data | AI narrative (verbatim) | Sev | Conf |
|---|---|---|---|---|---|---|---|
| 1 | `pay.duplicate-net-run` | SALARY_DUPLICATE_PAY | EMP-0142 Aarav Mehta, Sr. Engineer | Base ₹1,02,400. April 2026 has both REGULAR + CORRECTION run with same `net = ₹2,04,800` | "EMP-0142 (Aarav Mehta) shows ₹2,04,800 net in Apr 2026 — exactly 2× the 12-month median of ₹1,02,400. A CORRECTION run on 2026-04-28 reprocessed the same line as the REGULAR run on 2026-04-25 without offsetting. Recommend reversing the CORRECTION line and re-running export." | CRITICAL | 5 |
| 2 | `pay.spike-unjustified` | SALARY_SPIKE | EMP-0317 Diya Iyer, AE — IAM Sales | Median ₹78,500; Apr 2026 ₹2,15,000; no bonus, no revision record | "EMP-0317 net spiked 174% vs trailing-12 median. The increment lives in `specialAllowPaise`, not `bonusPaise`, and no revision letter is on file. Likely misclassified bonus or test-data leak." | HIGH | 4 |
| 3 | `pay.statutory-pf-missing` | STATUTORY_MISMATCH | EMP-0205 Rohan Pillai | Basic ₹68,000, expected PF ₹8,160 (12%), seeded `pfPaise = 0` | "EMP-0205 has ₹0 PF deduction on a ₹68,000 basic. Expected ₹8,160 at the 12% statutory rate. Either UAN is mis-mapped or the run skipped the PF policy." | HIGH | 5 |
| 4 | `pay.new-hire-no-proration` | NEW_HIRE_NO_PRORATION | EMP-0481 Shreya Banerjee, DOJ 2026-04-19 | Full month basic ₹72,000 paid; `daysPayable=30` | "EMP-0481 joined 2026-04-19 yet was paid a full month (30/30). Pro-rated expectation is 12 days = ₹28,800." | MEDIUM | 5 |
| 5 | `inv.missing-lines` | INVOICE_MISSING_LINES | Bharat Logistics (VEN-022), INV-2026-04-119 | PO has 6 lines = ₹4,82,000. Invoice has 5 lines = ₹4,17,500. Missing line: "Last-mile delivery — Pune, ₹64,500". Header still claims ₹4,82,000. | "Invoice INV-2026-04-119 from Bharat Logistics totals ₹4,82,000 in the header but the line items sum to ₹4,17,500. The missing line — 'Last-mile delivery — Pune, ₹64,500' — exists on PO-2026-0419. Header was likely re-typed without the line. Reflection on the deduction side: the same ₹64,500 appears as an unrecouped advance on AP ledger." | HIGH | 5 |
| 6 | `inv.duplicate` | INVOICE_DUPLICATE | NorthStar Office Supplies (VEN-008) | Two invoices `NS/2026/0411` and `NS/2026/0411-A`, same date, same ₹1,84,250, same 14 lines | "NorthStar Office Supplies submitted two invoices with identical line items totalling ₹1,84,250 within 36 hours. Match score 100% on lines, 98% on totals. Likely a duplicate submission, not a re-bill." | HIGH | 5 |
| 7 | `inv.price-drift` | INVOICE_PRICE_DRIFT | DataDrive Hardware (VEN-014) | Dell Latitude 5440 unit price: 6-month median ₹78,200 → last 2 invoices ₹91,500 + ₹93,200 (+17–19%) | "DataDrive Hardware's unit price for the Dell Latitude 5440 rose from a 6-month median of ₹78,200 to ₹91,500–₹93,200 (+17–19%) on the last two invoices. No PO amendment is on file." | HIGH | 4 |
| 8 | `inv.deduction-mismatch` | INVOICE_DEDUCTION_MISMATCH | Kaveri Travel House (VEN-031) | Invoice claims 2% TDS = ₹40,000; contract is 1%; ledger posted ₹20,000 | "Kaveri Travel House's invoice INV-KTH-04-31 shows TDS deducted at 2% (₹40,000). Contract terms specify 1% (₹20,000). The deduction reflected against this vendor in the ledger is ₹20,000 — a ₹20,000 mismatch the vendor will likely chase as a short payment." | MEDIUM | 4 |
| 9 | `inv.tax-inconsistent` | INVOICE_TAX_INCONSISTENT | SahyadriTech Services (VEN-007) | 5 lines, all same SaaS SKU, tax pct: 18, 18, 18, **12**, 18 | "Invoice INV-ST-2026-77 mixes 18% and 12% GST on five lines that are all the same SaaS subscription SKU. 12% is not a valid rate for this SAC code." | MEDIUM | 5 |
| 10 | `inv.gst-invalid` | INVOICE_GST_INVALID | Madhuri Catering (VEN-019) | GSTIN `27AAACM1234X1ZZ` (checksum fail) | "Vendor Madhuri Catering's GSTIN `27AAACM1234X1ZZ` fails the standard checksum. Either the GSTIN was mistyped on the invoice or the vendor is using a stale identifier." | MEDIUM | 5 |
| 11 | `spend.category-variance-laptops` | SPEND_CATEGORY_VARIANCE | Category: Laptops | 6-month avg ₹6,40,000/mo. Apr 2026: ₹14,80,000 (+131%) | "Laptops category spend in April 2026 hit ₹14,80,000 — 131% above the trailing 6-month average of ₹6,40,000. Three large purchases on 2026-04-09, 2026-04-15, 2026-04-22 drove the jump." | HIGH | 5 |
| 12 | `spend.unit-price-drift-veg` | SPEND_UNIT_PRICE_DRIFT | Tomatoes from Annapurna Mart (VEN-026) | 12-week median ₹42/kg → week 17 ₹78/kg (+86%) | "Tomatoes from Annapurna Mart jumped from a 12-week median of ₹42/kg to ₹78/kg in the week of 2026-04-22 (+86%). Same SKU, same vendor, no commentary on the invoice." | MEDIUM | 4 |
| 13 | `spend.off-contract` | SPEND_OFF_CONTRACT | Conference Catering | ₹1,18,500 entry from Tasty Bites Express (VEN-040), not on approved panel (VEN-019, VEN-033) | "A ₹1,18,500 catering charge on 2026-04-12 was booked against Tasty Bites Express (VEN-040), which is not on the approved catering panel (VEN-019, VEN-033). Off-contract purchase." | MEDIUM | 5 |
| 14 | `spend.split-purchase` | SPEND_SPLIT_PURCHASE | Office Equipment | 3 POs to VEN-008 within 9 days, each ₹49,500–₹49,900 (just under ₹50K approval threshold), aggregate ₹1,48,800 | "Three POs to NorthStar Office Supplies in 9 days, each ₹49,500–₹49,900 — all just under the ₹50,000 single-approver threshold. Pattern indicates threshold-avoidance split purchase." | HIGH | 4 |
| 15 | `spend.dup-procurement-entry` | SPEND_CATEGORY_VARIANCE | Office Equipment | Two `ProcurementEntry` rows: identical date, vendor, qty, unit price (₹62,400, conference chairs), different IDs | "Two procurement entries for 20 conference chairs at ₹62,400 each booked on 2026-04-17 against NorthStar (VEN-008). High likelihood of double-entry from CSV import." | MEDIUM | 4 |

---

## AI engine design

```ts
interface AIEngine {
  detectAnomalies(scope: DetectScope): Promise<Anomaly[]>
  explainAnomaly(anomalyId: string): Promise<{ narrative; citations; confidence }>
  answerQuestion(input): Promise<{ message; citations; suggestedFollowUps; matchedKey? }>
  summarizeCycle(cycleId: string): Promise<{ headline; bullets }>
}
```

**`ScriptedAIEngine` (V1)**:
- `detectAnomalies` runs SQL fingerprints against seeded data (e.g. `pfPaise = 0 AND basicPaise > 0` for #3; `runType IN ('REGULAR','CORRECTION')` collisions for #1; `header.total != SUM(lines)` for #5). Returns existing `Anomaly` rows.
- `explainAnomaly` is a pure registry lookup → `responses[anomaly.scriptedResponseKey]`.
- `answerQuestion` matches against ~30 hand-tuned patterns in `lib/ai/questions.ts`; fuzzy match via lowercase + stopword strip + token-overlap. Fallback: helpful "I can answer about X/Y/Z — try [chip] [chip] [chip]", never an error.
- `summarizeCycle` interpolates real counts into a fixed sentence frame.

**`LlmAIEngine` (V2 stub)**: same interface, swapped via `process.env.CHANAKYA_AI_ENGINE = 'llm' | 'scripted'` in `lib/ai/index.ts` factory. Not built in V1.

**Demo safety net**: free-typed gibberish always returns a graceful chip-based fallback. The presenter uses **Tour Mode** chips (W8 stretch) for the live show; free-type remains safe.

---

## Excel templates

Three files in `data/templates/`. Parser tolerates leading blank rows, merged headers, INR with commas, dates as `d/m/yyyy`, units inside numeric cells (`"5 nos"`, `"12.5 kg"`). Errors surfaced row-by-row in `/uploads/[id]/preview` — partial commit allowed.

### `payroll-input.xlsx`
- **Employees**: `EmpID, Name, Email, Department, Designation, Location, ManagerEmpID, DOJ, EmploymentType, CTC_Annual_INR, Basic_Monthly_INR, Active`
- **Payroll-2026-04** (one sheet per cycle): `EmpID, Days_Payable, LOP_Days, Basic, HRA, Special_Allow, OT, Bonus, Gross, PF, ESI, PT, TDS, Other_Ded, Net`
- **Adjustments**: `EmpID, Cycle, Type, Amount_INR, Reason, Approved_By`
- Validation: EmpID regex; `Gross == Σ` (warn); `Net == Gross − Σdeductions` (warn).

### `vendor-invoices.xlsx`
- **Vendors**, **POs**, **PO_Lines**, **Invoices**, **Invoice_Lines** — full schema per the data model.
- Validation: GSTIN regex + checksum; `Header Total ≈ Σ lines` within ₹1 (else flag `INVOICE_MISSING_LINES`); `(VendorCode, Invoice_Number)` unique (else `INVOICE_DUPLICATE` candidate).

### `procurement-spend.xlsx`
- **Categories**: `Category_Name, Monthly_Budget_INR, Owner_Email`
- **Entries**: `Category_Name, VendorCode, Invoice_Number, OccurredOn, Description, Unit, Quantity, Unit_Price_INR, Total_INR, Location`
- Unit ∈ `{KG, UNIT, LITRE, HOUR, BOX}`; variance runs post-commit.

Each template ships in three variants under `data/samples/`: `clean`, `messy`, `broken` — for QA.

---

## Information architecture

| Path | Roles | Purpose |
|---|---|---|
| `/login` | public | Email + password (seeded) |
| `/dashboard` | all | Role-aware KPIs, 5 most-recent anomalies, cycle status strip |
| `/payroll` → `/[cycleId]` → `/anomalies`, `/employees/[empId]` | CFO, HR_OPS, LEAD_RO | Cycles, runs, anomalies, employee 18-month chart |
| `/vendors` → `/[vendorId]` → `/invoices/[invoiceId]`, `/anomalies` | CFO, VENDOR_MGR, LEAD_RO | Vendor list, detail, invoice viewer w/ reconciliation panel |
| `/spend` → `/categories/[id]`, `/anomalies` | CFO, OPS_MGR, LEAD_RO | Category cards, drill, unit-price trends |
| `/ask` | all | NL Q&A console with citation chips + follow-up suggestions |
| `/uploads` → `/[id]/preview` | uploaders, CFO | Drop zone, parse preview, commit |
| `/integrations` | CFO, SYS_ADMIN | Zoho, Tally, Email, Slack, WhatsApp cards (mocked sync + run) |
| `/audit` | CFO, SYS_ADMIN, LEAD_RO | Filterable, CSV-exportable log |
| `/settings` | SYS_ADMIN | Users, roles, feature flags |

Sidebar order: Dashboard → Payroll → Vendors → Spend → Ask → Uploads → Integrations → Audit → Settings.

---

## Design system (Razorpay-style)

Tokens in `app/globals.css` via Tailwind v4 `@theme`:

| Token | Value | Use |
|---|---|---|
| `--color-navy-900` | `#0D2A4D` | Sidebar, primary buttons, header |
| `--color-navy-700` | `#1A3D6C` | Hover, focus rings |
| `--color-saffron-500` | `#F59E0B` | Brand accent (≤10% surface) |
| `--color-saffron-50` | `#FEF6E5` | KPI highlight, AI Explain panel bg |
| `--color-bg` | `#F7F8FB` | App background (cool, never cream) |
| `--color-surface` | `#FFFFFF` | Cards, tables |
| `--color-border` | `#E4E7EC` | All 1px borders |
| `--color-ink-900` | `#0F172A` | Primary text |
| `--color-ink-500` | `#64748B` | Secondary text |
| `--color-ok / warn / bad / info` | green / amber / red (controlled) / blue | Status with dot + label (never color alone) |
| `--radius-card` | `10px` | |
| `--shadow-card` | `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)` | Subtle |

**Typography**: Archivo (UI), JetBrains Mono with `tabular-nums` (numbers/IDs/timestamps). Currency: `₹` + `en-IN` grouping, lakh/crore in summaries (`₹1.48 Cr`).

**Patterns**: KPI tile (title + 28px Mono value + delta chevron + sparkline strip); Anomaly card (color dot + severity label, narrative, 2–4 citation chips, `Explain ›` opens 380px right drawer); Data table (TanStack, sticky header, 44px rows, right-aligned Mono money cells, saffron hover); AI Explain panel (saffron-50 bg + `Sparkles` icon + citation Mono chips); Status pill (dot + label always); Confidence meter (5 filled ticks).

**Anti-patterns** (carried from PayOps): no cream backgrounds, no three-card hero, no side-stripe colored borders, no color-only status, no red destructive default buttons, no marketing-voice empty states, no spinners where skeletons fit, no modals for multi-step work.

---

## Week-by-week milestones

| Week | Ships | Demoable artifact |
|---|---|---|
| **W1 — Scaffold** | Repo init, Next 16 + Tailwind v4, Prisma 7 + Supabase, NextAuth v5 with 6 seeded users (one per role + 3 extras), AppShell, sidebar, role badge, design tokens, `lib/format.ts`, CI scaffold. PRODUCT.md + DESIGN.md drafted. | Login works; `/dashboard` placeholder grid in correct palette/type. |
| **W2 — Data spine** | Full Prisma schema, migrations, dictionaries, generators for 486 employees / 18 cycles / 40 vendors / 50 POs / 1,500 invoices / 8 categories / ~6,000 procurement entries. `seed/anomalies.ts` plants the 15 anomalies. Excel parser skeleton + payroll template. AuditEntry write path. | `pnpm db:seed` populates realistic DB. Drop `payroll-input.messy.xlsx` → parse preview renders 25 rows + warnings. |
| **W3 — Payroll + Scenario 1** | `/payroll`, `/payroll/[cycleId]`, employee detail w/ 18-month chart. Anomaly list + drawer. `ScriptedAIEngine.detectAnomalies` covers #1–#4. `ExplainPanel` renders narrative + citations. Audit entries fire on acknowledge/dismiss. | **Scenario 1**: EMP-0142 ₹2,04,800 vs ₹1,02,400 — AI catches duplicate run end-to-end. |
| **W4 — Vendors + Scenario 2** | `/vendors`, vendor detail, invoice viewer w/ header-vs-lines reconciliation. Anomalies #5–#10. Vendor-spend trend. Email-inbox connector mock with 3 unprocessed invoices. | **Scenario 2**: Bharat Logistics missing line; NorthStar duplicate; DataDrive drift; Kaveri TDS reflection mismatch. |
| **W5 — Spend + Scenario 3** | `/spend` category cards, drill, unit-price-trend chart. Anomalies #11–#15. Procurement template + parser. Budget vs actual variance bar. | **Scenario 3**: Laptops +131%, tomatoes ₹42→₹78/kg, off-contract catering, split purchase. |
| **W6 — NL Q&A + Scenario 4** | `/ask` chat UI, `AIConversation` + `AIMessage` persistence, 30 hand-tuned Q&A patterns with token-overlap fuzzy match, citation chips deep-link to records, suggested follow-ups. `summarizeCycle` powers dashboard "AI snapshot" card. | **Scenario 4**: 5 canned chips + 1 cross-domain Q + free-type fuzzy match + graceful gibberish fallback. |
| **W7 — Integrations + alerts + polish** | Connector cards (Zoho/Tally/Email/Slack/WhatsApp) w/ mocked sync + last-sync. Toast + "Sent to #finance" badge on anomaly raise. Excel export for any table. RBAC audit. A11y pass (focus rings, ARIA). Empty states, skeletons, contrast check. | "Run Sync" on Zoho → progress → success stamp. HIGH anomaly raised → toast + Slack badge. |
| **W8 — Dry-runs + bug bash** | 3 full demo dry-runs against fresh DB. Playwright E2E for the 4 scenarios. Perf (table virtualization >1K rows). README + demo runbook. **Stretch**: 2nd seeded "April 2025" cycle for YoY questions + **Tour Mode** sidebar (clickable demo prompts). | Full demo rehearsed in ≤22 min. |

---

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Scripted AI feels fake** when user free-types off-pattern | High | High | (a) 30 hand-tuned patterns + token-overlap fuzzy match, (b) graceful fallback w/ 4 alternate chips (never an error or freeze), (c) **Tour Mode** chips for the live show — presenter clicks, never free-types |
| 2 | **Data realism gap** — names/amounts/patterns feel uncanny | Medium | High | Real Indian first-name + surname dictionaries balanced across regions; MiniOrange-style departments; designation-keyed salary bands; vendor names with Indian provenance; en-IN INR everywhere. Eyeball-check 30 employees + 20 vendors before W3 lock. |
| 3 | **Excel parser brittleness** on a live drag-and-drop | Medium | Medium | 3 template variants per kind (`clean`/`messy`/`broken`); parser tolerates blank rows, merged headers, INR formatting, units in numerics, alt date formats; partial commit w/ row-by-row warnings. Demo uses `messy` on purpose. |
| 4 | **Docker Desktop blocked** on this Windows box (memory note) | High | Medium | Default DB = Supabase free tier via `.env.local`. `infra/docker-compose.yml` shipped but optional. README leads with Supabase path. |
| 5 | **Scope creep eats W8** | High | High | W8 is dry-runs and bug-fix only — no new features. Missed weekly gates trigger scope-cut from the *next* week, not extending into W8. Anti-references inherited from PayOps stay enforced. |

---

## Verification plan

Prototype is demo-ready when **all 10** pass on a fresh checkout:

1. **Bootstrap** — `pnpm install` ok; `.env.local` set; `pnpm db:migrate && pnpm db:seed` produces 486 employees, 18 cycles, 40 vendors, ~1,500 invoices, ~6,000 entries, **and 15 anomalies in OPEN status**; `pnpm dev` boots.
2. **Auth + RBAC** — login as each of 5 roles; sidebar adapts; forbidden routes 403 server-side.
3. **Scenario 1 (Salary)** — `/payroll/2026-04/anomalies` shows EMP-0142 CRITICAL row; `Explain ›` drawer renders duplicate-run narrative + 2 citation chips; click citation → employee chart shows spike; acknowledge → audit entry recorded.
4. **Scenario 2 (Vendor)** — `/vendors/anomalies` lists 6 rows (#5–#10); Bharat Logistics invoice reconciliation panel shows ₹4,82,000 vs ₹4,17,500 with the missing Pune line; Kaveri narrative shows the ₹40K vs ₹20K deduction reflection.
5. **Scenario 3 (Spend)** — `/spend` Laptops card +131% saffron delta; tomato unit-price chart spike at week 17 with anomaly badge; split-purchase narrative names the three POs.
6. **Scenario 4 (Q&A)** — 5 suggested chips return templated answers w/ ≥2 citations each; free-typed "what about food costs" fuzzy-matches to tomato narrative; gibberish returns fallback chips, no error.
7. **Integrations + alerts** — "Run Sync" on Zoho → DEGRADED → CONNECTED + timestamp; HIGH anomaly raised → toast + "Sent to #finance · just now" badge + Notification row in DB.
8. **Excel upload** — drag `payroll-input.messy.xlsx` → preview lists 25 rows + ≥3 warnings + 0 errors → Commit → `ExcelUpload` in COMMITTED + audit entries.
9. **Audit log** — `/audit` ≥8 entries from the demo with actor, role, action, objectId, before/after; CSV export works.
10. **Quality gates** — `pnpm typecheck` 0 errors; Vitest green w/ ≥80% coverage on `lib/excel/parse.ts`, `lib/ai/scripted.ts`, `lib/anomalies/detector.ts`, `lib/format.ts`; Playwright 4 scenario specs green; Lighthouse `/dashboard` ≥90 a11y + best-practices.

When all 10 pass, demo runs Scenarios 1→4 in ≤22 min, lands on `/audit` for the trail, ends on `/integrations` for the connector + alert story.

---

## Critical files for implementation

- [chanakya/prisma/schema.prisma](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\prisma\schema.prisma) — data spine; every scenario reads/writes here.
- [chanakya/lib/ai/engine.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\ai\engine.ts) — `AIEngine` interface that locks scripted vs LLM swappability.
- [chanakya/lib/ai/responses.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\ai\responses.ts) — 15 anomaly narratives + ~30 Q&A patterns; the demo's heart.
- [chanakya/lib/ai/questions.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\ai\questions.ts) — NL pattern matcher with fuzzy fallback.
- [chanakya/lib/anomalies/detector.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\anomalies\detector.ts) — SQL fingerprints that surface the 15 anomalies.
- [chanakya/seed/anomalies.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\seed\anomalies.ts) — plants the exact data patterns the detector finds.
- [chanakya/lib/excel/parse.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\excel\parse.ts) — messy-real-world parser whose robustness determines whether the upload demo survives a live drop.
- [chanakya/lib/format.ts](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\lib\format.ts) — `InrAmount` formatter (paise → `₹1,23,45,678` / `₹1.23 Cr`).
- [chanakya/app/(app)/ask/page.tsx](C:\Users\Surajit\Desktop\Kurukshatra\chanakya\app\(app)\ask\page.tsx) — Q&A composer with citation chips and the Tour Mode entry point.

---

## Reference (existing, read-only)

- PayOps app: `C:\Users\Surajit\Documents\Claude\Projects\payops` — copy patterns (`lib/db.ts` Prisma init, `lib/rbac/*`, `lib/connectors/*` adapter shape, `app/globals.css` token approach, `auth.ts` NextAuth v5 setup). **Do not modify.**
- PRODUCT.md: `C:\Users\Surajit\Downloads\PRODUCT.md` — inherits anti-references (NOT a payroll engine, NOT an HRIS, NOT accounting, NOT autonomous AI), but Chanakya **expands** scope to vendor management + external spend + AI-first analytics.
