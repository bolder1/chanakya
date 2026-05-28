# Chanakya — Product

> Context file for Claude Code. This is the durable description of Chanakya — what it is, who uses it, what it owns and what it does *not* own. Read this before writing or changing any code. Companion files: `DESIGN.md` (visual + interaction system) and `BUILD_PLAN.md` (week-by-week milestones).

## What this is

Chanakya is MiniOrange's internal AI-first **financial intelligence platform**. It ingests three streams the finance and operations teams already work with — monthly payroll, vendor invoices (with their POs), and external procurement spend (laptops, vegetables, catering, equipment) — then detects anomalies, explains them in plain language with citations to the underlying records, and answers natural-language questions across the whole dataset.

The product is named after Chanakya (Kautilya), the ancient Indian economist who wrote the Arthashastra — a treatise on statecraft, economics, and the meticulous tracking of revenue and expenditure. The product carries that brief: see everything, miss nothing, and tell the truth in plain words.

**Critical boundary, stated up front for the agent:** Chanakya is *not* a payroll engine. It does not compute statutory tax (PF/ESI/PT/TDS) and it does not move money. It does not own the ledger. It produces clean, approved analytics and detected anomalies for the humans and the systems-of-record (Zoho Payroll, Tally) that do. See *Anti-references* and *Architecture & boundaries* below.

## Register

**Product, leaning utility-fintech.** This is an internal operational tool — but the design borrows from Indian fintech (Razorpay) so finance teams feel at home: dense tables, INR-native formatting, calm under stakes, audit-visible everywhere. The only brand obligation is that, as a security company's own tool, it must visibly meet the access/audit standards MiniOrange sells to customers.

## Users

| User | Daily context | What they need |
|---|---|---|
| **CFO / Finance** *(primary)* | The central operator. In Chanakya daily during a cycle. Approves payroll registers, reviews vendor invoices, watches spend variance. | One screen with the cycle state, top anomalies, AI snapshot, and unresolved approvals. Q&A for anything ad-hoc. |
| **HR Ops** *(secondary)* | Payroll cycle, employee data accuracy. | Payroll cycle + anomaly inbox; upload payroll Excel; first-level approve. |
| **Vendor Manager** *(secondary)* | Vendor onboarding, invoices, deduction-reflection reconciliation. | Vendor list + invoice viewer with header-vs-line reconciliation; AI Explain panel on every flagged invoice. |
| **Operations Manager** *(secondary)* | Procurement and external spend. Categories, vendors, unit prices. | Spend category drill-down + variance bar + unit-price trend chart. |
| **Leadership (read-only)** *(secondary)* | Cycle health and cost. | Read-only across the board. AI snapshot, KPIs, anomaly summary. |
| **Sys Admin** *(edge)* | RBAC, connectors, integrations health. | Configure access and integrations; no payroll-data edits. |

## Tools — the V1 inventory

Tools are organized as they appear in the navigation. Order is significant.

### 1. Pulse

| Tool | Job |
|---|---|
| **Dashboard** | Role-aware KPIs (Apr payout, vendor spend YTD, ops spend MTD, open anomalies) + cycle status strip + AI snapshot + 5 most-recent anomalies + "Needs your attention" queue. |
| **Ask** | Natural-language Q&A across payroll, vendors, and spend. Citation chips deep-link to records. Conversation history per user. Tour-mode chips for demo prompts. |

### 2. Workflows

| Tool | Job |
|---|---|
| **Payroll** | Monthly cycle list, cycle detail with payouts and anomalies, employee detail with an 18-month salary chart. Detects salary spikes, duplicate net pay, statutory mismatches, and unprorated joiners. |
| **Vendors** | Vendor master + per-vendor PO/invoice ledger + invoice viewer with header-vs-lines reconciliation. Detects missing lines, duplicates, price drift, deduction-reflection mismatches, inconsistent tax, invalid GSTIN. |
| **Spend** | External procurement categories with monthly budgets. Drill into Laptops, Vegetables & Pantry, Office Equipment, Conference Catering. Detects category variance, unit-price drift, off-contract purchases, split purchases, duplicates. |

### 3. Plumbing

| Tool | Job |
|---|---|
| **Uploads** | Drag-and-drop Excel/CSV ingestion. Parses payroll, invoices, and procurement formats; normalizes INR with commas, units in cells, alternative date formats; previews with row-level warnings; partial commit allowed. |
| **Integrations** | Connector cards: Zoho People, Zoho Payroll, Tally, Email inbox (`invoices@chanakya.app`), Slack, WhatsApp. Status, last-sync, manual re-sync. |
| **Audit** | Append-only, immutable record of every state-changing action. Actor, role, action, before/after JSON, cycle. CSV export. |
| **Settings** | Users, roles, feature flags. Sys Admin only. |

### Out of scope for this document

The employee-facing request portal, mobile approvals, a configurable rules engine, multi-entity support, and live LLM responses (V2) are all out of V1 inventory. Statutory computation, disbursement, accounting journals, and the core HRIS are owned by other systems entirely (see *Architecture & boundaries*).

## Jobs to be done

1. **"When salary anomalies happen, I want the system to find them before I do, with a confident explanation."** *Touches Payroll, Anomalies.*
2. **"When a vendor invoice arrives, I want the system to reconcile it against the PO and the AP ledger and flag every mismatch — missing lines, duplicates, drift, tax inconsistencies, GSTIN problems."** *Touches Vendors, Anomalies.*
3. **"When external spend trends abnormally — laptops, vegetables, anything — I want to know immediately, with the offending transactions named."** *Touches Spend, Anomalies.*
4. **"When I want to know anything across the dataset, I want to type a sentence and get a cited answer in seconds."** *Touches Ask.*
5. **"When Excel files arrive in messy real-world shape, I want them parsed and validated automatically, with a preview before commit."** *Touches Uploads.*
6. **"When anyone asks who changed a number, I want a complete, immutable answer."** *Touches Audit.*

## Voice & tone

- **Direct.** "EMP-0142 net pay 2× the trailing-12 median — duplicate CORRECTION run." Not "Hmm, looks interesting!"
- **Specific in success.** Success reads "Logged · time · who" and links to the audit entry. Never a bare check.
- **Specific in failure.** Name the blocker: "5 anomalies still open — acknowledge or dismiss before generating the register."
- **Calm at stakes.** High-stakes confirmations explain the consequence plainly.
- **No marketing voice.** No "Awesome!", "Oops!", or exclamation marks.
- **Cite or stay quiet.** AI answers always cite the underlying record; if there isn't one, the answer says so.

## Strategic principles

1. **One screen per decision.** A tool is a verb. If a decision sprawls across pages, it's two tools.
2. **AI is advisory; humans approve.** No AI feature approves, posts, or exports without a human. This is deliberate.
3. **Cite or stay quiet.** Every AI narrative has at least one citation chip.
4. **Always show audit context.** Every state-changing action surfaces "Logged · time · who" with a link to the entry.
5. **Bulk by default.** Demo data and real ops are bulk. Single-record is the constrained subset.
6. **Read paths are read-only.** View screens never offer destructive actions inline. Edit mode is a deliberate transition.
7. **Stake-graded friction.** Friction matches the cost of being wrong (see *Stakes model*).
8. **Separation of duties.** No user both creates and approves the same item. Final approval on register/export requires Finance.
9. **Integer paise everywhere.** Money is never a float.

## Anti-references

What Chanakya is **not** — boundaries that prevent scope creep and wrong builds.

- **Not a payroll engine.** Zoho Payroll computes statutory tax (PF/ESI/PT/TDS) and disburses. Chanakya reads the inputs, flags the anomalies, and produces the export.
- **Not an accounting system.** Tally owns the ledger and journal entries. Chanakya reads the AP-side reflection to detect deduction-reflection mismatches; it never writes journals.
- **Not an HRIS.** Zoho People owns the employee master, onboarding, and leave. Chanakya reads it; it never edits it.
- **Not autonomous AI.** No feature may approve, post, or export without a human. This is deliberate, not a limitation.
- **Not a spreadsheet replica.** Don't reproduce free-form-cell editing. Structured records, validation, and detection are the entire point.
- **Not a consumer app.** No marketing-voice empty states, no celebratory copy, no decorative UI. Calm and utility-first.

## Stakes model

| Tier | Examples | Required friction |
|---|---|---|
| Low | view, edit a single draft | none |
| Medium | acknowledge a single anomaly, commit a parsed upload | single-click confirmation |
| High | bulk-dismiss 25+ anomalies, lock a cycle, run a sync | type-to-confirm |
| Critical | export the register, grant a role | type-to-confirm + Finance approver |

## Architecture & boundaries

Chanakya is an **analytics + anomaly-detection layer that sits between the input layer and the systems of record.**

```
INPUT LAYER              CHANAKYA                       SYSTEMS OF RECORD
- Excel / CSV uploads    - parse + validate             - Zoho People  (employee master, read)
- Email-to-invoice       - detect anomalies             - Zoho Payroll (computation + LOP + pay, write)
- Direct entry           - explain with citations       - Tally        (accounting journal, write cost data)
- Mocked connectors      - answer NL questions
  (Zoho, Tally)          - audit everything
                         - the operations console
```

- **Reads from:** Zoho People (employee master), Excel/CSV uploads, email inbox (mocked V1).
- **Writes to:** Zoho Payroll (approved register, V2), Tally (cost data, V2).
- **Owns:** clean validated inputs, validation rules, anomaly detection, AI explanations + Q&A, audit trail, the operations console.
- **Never owns:** tax math, disbursement, the GL, the employee master, employee onboarding.

Every connector is an isolated module with health/last-sync/last-error surfaced and a manual re-sync. Sync failures are surfaced, never silent. Excel upload is the fallback for any integration that's constrained.

## Roles & permissions (RBAC summary)

Enforce **server-side** in `lib/rbac/`. See `lib/rbac/capabilities.ts` for the source of truth.

| Capability | CFO/Finance | HR Ops | Vendor Mgr | Ops Mgr | Leadership | Sys Admin |
|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Payroll | view·approve·generate | view·edit·approve | — | — | view | — |
| Vendors | view·approve | — | view·edit·approve | — | view | — |
| Spend | view | — | — | view·edit | view | — |
| Anomalies | view·ack·dismiss | view·ack·dismiss | view·ack·dismiss | view·ack·dismiss | view | — |
| Ask | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Uploads | all kinds·commit | payroll·commit | invoices·commit | procurement·commit | — | — |
| Integrations | view·sync | — | — | — | — | view·sync·configure |
| Audit | view·export | view | — | — | view | view·export |
| Settings | — | — | — | — | — | users·roles |

Rules: can't approve what you created; locked cycles are read-only for all; Sys Admin configures access but can't edit payroll data.

## Open product questions

These block engineering estimation, not design.

- **Exact statutory rates and ceilings** for PF/ESI/PT/TDS in MiniOrange's jurisdictions (Bengaluru/Pune/Remote). Needed to encode `STATUTORY_MISMATCH` thresholds beyond seeded examples.
- **Zoho Payroll import format / API contract.** Needed for V2 register export.
- **Tally cost-data write format.** Needed for V2 cost handoff.
- **Statutory retention period** for records and audit logs. Resolved by Finance/Legal.
- **Approved on-premise AI model + runtime** for V2 `LlmAIEngine`. Resolved by IT/Security.

---

# Appendix for the coding agent

## The data model — short version

See `prisma/schema.prisma` for the full schema. Key entities:

- **Cycle** — a monthly period. States: `OPEN → LOCKED → CLOSED`.
- **Employee** — synced from Zoho People (id, name, designation, department, status, doj). Read-only in Chanakya.
- **PayrollRun** + **PayrollLine** — `runType: REGULAR | BONUS | CORRECTION`; lines carry basic, HRA, special, OT, bonus, gross, PF, ESI, PT, TDS, other_ded, net, days_payable, LOP. Money in paise.
- **Vendor** + **PurchaseOrder** + **PurchaseOrderLine** — vendor master + POs.
- **Invoice** + **InvoiceLine** — invoices with line items; unique `(vendorId, invoiceNumber)`.
- **ProcurementCategory** + **ProcurementEntry** — external spend with units (KG, UNIT, LITRE, …) and unit prices.
- **Anomaly** — polymorphic via nullable scoped FKs (`payrollLineId | invoiceLineId | procurementEntryId | invoiceId | employeeEmpId | vendorId | cycleId`). `kind`, `severity (LOW/MEDIUM/HIGH/CRITICAL)`, `confidence (1–5)`, `scriptedResponseKey`, narrative.
- **AuditEntry** — append-only: timestamp, actor, role, action, object, before/after.
- **ExcelUpload** — kind, row/warning/error counts, status.
- **AIConversation** + **AIMessage** — chat persistence with citation chips.
- **Connector** — Zoho People / Zoho Payroll / Tally / Email / Slack / WhatsApp, each with status, last-sync, last-error.

## AI engine contract

`lib/ai/engine.ts` is the interface. V1 ships `ScriptedAIEngine` in `lib/ai/scripted.ts`, reading pre-baked narratives from `lib/ai/responses.ts` and answering NL questions through pattern matchers in `lib/ai/questions.ts`. V2 swaps in `LlmAIEngine` behind the same interface via `CHANAKYA_AI_ENGINE` env.

## Design system pointers

See `DESIGN.md` for the full system. In short: deep navy `#0D2A4D` (sidebar/structure) + saffron `#F59E0B` (accent, ≤10% surface) + cool app background `#F7F8FB` (never cream) + JetBrains Mono for numbers/IDs/timestamps + Archivo for UI. Status is dot + label, never color alone.
