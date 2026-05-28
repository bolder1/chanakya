# Chanakya

**AI-powered payroll + financial/operational analytics for MiniOrange.**

Chanakya ingests payroll, vendor invoices, and external procurement spend, then detects anomalies (salary spikes, duplicate runs, missing invoice lines, off-contract purchases, unit-price drift, hostel/payroll mismatches) and explains them with citations to the underlying records. Built in Next.js 16, Prisma 7, Postgres (Supabase), NextAuth v5 beta. AI is advisory — humans approve.

> Companion docs: [PRODUCT.md](./PRODUCT.md) (product intent + scope), [DESIGN.md](./DESIGN.md) (design tokens + patterns), [BUILD_PLAN.md](./BUILD_PLAN.md) (week-by-week milestones).

---

## Quick start

### Prerequisites
- Node 22+, pnpm 10+
- A Postgres database — **Supabase** (recommended, free tier, IPv4 via Transaction pooler) or local Docker via the included `infra/docker-compose.yml`.

### 1. Install + env

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local — paste your Supabase Transaction pooler DATABASE_URL
# and set AUTH_SECRET / NEXTAUTH_SECRET to any 64-char hex string.
```

### 2. Database

```bash
pnpm db:migrate          # apply Prisma migrations
pnpm db:seed             # seed 9 users + 486 employees + 18 cycles + 41 vendors + 530 invoices + 2,600 procurement entries + 20 anomalies (~14 min on Supabase free tier)
```

### 3. Run

```bash
pnpm dev
# open http://localhost:3000  → redirected to /login
```

---

## Demo accounts (password: `demo`)

| Email | Role | What they see |
|---|---|---|
| `cfo@miniorange.test` | CFO · Finance | Everything except Settings (8 modules) |
| `hrops@miniorange.test` | HR Ops | Dashboard, Payroll, Uploads, Audit, Tour |
| `vendor@miniorange.test` | Vendor Manager | Dashboard, Vendors, Uploads, Tour |
| `ops@miniorange.test` | Operations Manager | Dashboard, Spend, Uploads, Tour |
| `leadership@miniorange.test` | Leadership (RO) | Dashboard, Payroll/Vendors/Spend (read-only), Tour |
| `sysadmin@miniorange.test` | Sys Admin | Dashboard, Integrations, Audit, Settings, Tour |

Sidebar adapts per role. `/tour` is the demo runbook — visible to every role.

---

## 22-minute manager demo

Open `/tour` for the live runbook with one-click chips. Order:

| Step | Where | What to show |
|---|---|---|
| 1 — Dashboard | `/dashboard` | Cycle status, AI snapshot, 4 KPIs (₹7.10 Cr payout / ₹31.01 Cr vendor spend / ₹2.36 Cr ops spend / 20 anomalies). |
| 2 — Salary anomaly | `/payroll/2026-04/anomalies` → EMP-0142 | Explain drawer shows duplicate net-pay narrative. 18-month chart at `/payroll/employees/EMP-0142`. Acknowledge → audit. |
| 3 — Vendor invoice | `/vendors/anomalies` → Bharat Logistics invoice | Header-vs-lines reconciliation panel: ₹4,82,000 header vs ₹4,17,500 lines, missing Pune line flagged. |
| 4 — Spend variance | `/spend` (Laptops +131%) and `/spend/categories/[Laptops]` | Monthly + unit-price charts with saffron-dot highlight. |
| 5 — NL Q&A | `/ask` → "Why did Aarav Mehta's salary double?" | Scripted answer with citation chip → deep-link to employee detail. |
| 6 — Excel ingestion | `/uploads` → drop `data/samples/payroll-input.messy.xlsx` | Parser detects PAYROLL kind, 15 rows, 6 warnings — Commit → audit. |
| 7 — Audit | `/audit` | Every action from the demo with before/after JSON. |
| 8 — Integrations | `/integrations` | "Run sync" on Tally → DEGRADED → CONNECTED + audit. |
| 9 — Finale | Dashboard → "Generate register" | Type-to-confirm LOCK → cycle locked → CSV downloads (488 lines, MiniOrange-shaped columns). |

---

## What's in the box

**Modules** (sidebar order): Dashboard · Payroll · Vendors · Spend · Ask · Uploads · Integrations · Audit · Settings · Demo tour.

**Real demo anomalies** (20 planted in cycle 2026-04 — narratives are deterministic, AI doesn't improvise on stage):
- 4 payroll: salary spike, duplicate pay, missing PF, unprorated joiner, broken net formula, LWP not reflected, exit paid full month
- 2 hostel: hostel TOTAL ≠ sum, hostel ≠ payroll guesthouse deduction
- 1 shift: shift days entered but ₹0 SHIFT ALLOWANCE
- 6 vendor invoice: missing lines, duplicate, price drift, TDS deduction mismatch, inconsistent GST, invalid GSTIN
- 4 spend: category variance +131% (Laptops), unit-price drift (tomatoes), off-contract catering, split-purchase pattern

**AI engine.** V1 ships `ScriptedAIEngine` — pre-baked narratives keyed off planted anomaly fingerprints, plus ~30 hand-tuned NL question patterns with token-overlap fuzzy match and a graceful chip fallback. V2 will introduce `LlmAIEngine` behind the same `lib/ai/engine.ts` interface; swap via `CHANAKYA_AI_ENGINE=scripted|llm`.

**Audit log immutability.** The `audit_entries` table has a PostgreSQL trigger (`audit_entries_block_mutation`) that rejects UPDATE / DELETE / TRUNCATE with `RAISE EXCEPTION ... insufficient_privilege`. Even a superuser cannot tamper. See `migrations/audit_entries_immutable`.

**Money.** Stored as integer paise (×100 on ingest). Formatted via `lib/format.ts` — `formatInr`, `formatInrCompact` (`₹1.48 Cr` / `₹14.80 L`), `formatPct`.

**Excel parser.** SheetJS with messy-real-world tolerance:
- `REIMBURSTMENT` typo (sic) and `Accomodation` typo accepted via alias maps
- INR with `₹` and commas stripped
- Units in numeric cells (`5 nos`, `12.5 kg`)
- Multiple date formats (ISO, d/m/yyyy, dd-mm-yyyy, Excel serial)
- Leading blank rows skipped via header-row sniffing
- Footer "Total" / "Grand Total" rows skipped
- Auto-detects PAYROLL / ATTENDANCE / SHIFT / HOSTEL / INVOICES / PROCUREMENT kinds
- Inline row-level validation warnings (PF=0 on high basic, NET ≠ GROSS−DEDUCTIONS, hostel TOTAL mismatch, LWP not reflected, etc.)

---

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Local Next dev on :3000 |
| `pnpm build` | Production build (standalone output) |
| `pnpm typecheck` | TypeScript check, no emit |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |
| `pnpm test` | Vitest unit tests (56 tests across format / messy / AI questions) |
| `pnpm test:e2e` | Playwright E2E (scaffolded; specs forthcoming) |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed all demo data |
| `pnpm db:reset` | Drop + remigrate + reseed |
| `pnpm db:studio` | Prisma Studio on :5555 |

---

## Architecture

```
chanakya/
├── app/
│   ├── (auth)/login/             # NextAuth credentials login
│   ├── (app)/                    # session-required shell
│   │   ├── dashboard/            # cycle status, KPIs, recent anomalies
│   │   ├── payroll/              # cycle list, detail, anomaly inbox, employee timeline
│   │   ├── vendors/              # vendor list, detail, invoice viewer with header-vs-lines reconciliation
│   │   ├── spend/                # category cards, drill with charts, anomalies
│   │   ├── ask/                  # Q&A composer wired to ScriptedAIEngine via server action
│   │   ├── uploads/              # drag-drop + parse preview + commit
│   │   ├── integrations/         # 6 connectors with mocked sync
│   │   ├── audit/                # append-only log table
│   │   ├── tour/                 # demo runbook with 12 step chips
│   │   └── settings/             # stub (W2 of future work)
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── uploads/              # multipart POST
│       └── registers/[cycle]/export/  # CSV download
├── components/                   # ui, chrome, kpi, anomaly, tables, charts, chat, status, upload, payroll, auth
├── lib/
│   ├── auth.ts, auth.config.ts   # NextAuth v5 split config (edge-safe middleware)
│   ├── session.ts                # requireUser / requireCap / getUser helpers
│   ├── rbac/capabilities.ts      # full capability matrix (6 roles × 25 caps)
│   ├── actions.ts                # server actions: acknowledge/dismiss/reopen anomaly, sync connector, ask AI, commit upload, lock cycle
│   ├── ai/                       # AIEngine interface + ScriptedAIEngine + 16 anomaly responses + ~30 NL patterns
│   ├── anomalies/                # detector + types
│   ├── excel/                    # SheetJS parser + Zod schemas + messy normalizer
│   ├── dashboard.ts, payroll.ts, vendors-data.ts, spend-data.ts, register.ts
│   └── db.ts, format.ts, log.ts, utils.ts
├── prisma/{schema.prisma, seed.ts, migrations/}
├── seed/                         # data generators (people/payroll/vendors/procurement/hostel/anomalies)
├── data/samples/                 # messy demo xlsx
├── tests/unit/                   # Vitest — 56 tests across format / excel-messy / ai-questions
└── middleware.ts                 # route protection via authConfig
```

---

## Production hardening status

- ✅ DB audit immutability trigger (`audit_entries_block_mutation`) — UPDATE/DELETE/TRUNCATE physically rejected at Postgres level
- ✅ NextAuth credentials + bcrypt + JWT (8h TTL) + middleware route protection
- ✅ Server-enforced capability matrix (`lib/rbac/capabilities.ts`)
- ✅ Money as integer paise (no floats)
- ✅ 56 Vitest unit tests for parsers, formatters, AI matching
- ⏳ Playwright E2E specs scaffolded but not yet written
- ⏳ Statutory rates (PF cap, PT slab, TDS) hardcoded — open product question per PRODUCT.md
- ⏳ Real LLM swap (V2)

---

## Troubleshooting

**`DATABASE_URL is not set`** — Copy `.env.example` to `.env.local` and paste the Supabase Transaction pooler URL with `?pgbouncer=true`. URL-encode special chars in your password (`@` → `%40`).

**`no matching decryption secret`** — Stale session cookie. Clear cookies for `localhost:3000` or use an Incognito window.

**`Prisma not generated`** — Run `pnpm db:generate` (also auto-runs on install).

**Docker Postgres won't start on Windows** — Known issue; default to Supabase. If you must use Docker, restart Docker Desktop from the tray and run `pnpm db:up`.

**Seed takes ~14 minutes on Supabase free tier** — Expected; the Transaction pooler has higher latency per query. Run once and you're set. `pnpm db:seed` is idempotent (wipes data, keeps users).

---

Built by MiniOrange — Chanakya runs on MiniOrange infrastructure. AI is advisory; humans approve.
