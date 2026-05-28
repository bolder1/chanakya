# Chanakya — Design

Inspired by Razorpay. Indian fintech aesthetic: dense, data-rich, INR-native, calm. Tokens live in `app/globals.css` and are exposed both as CSS custom properties and Tailwind utilities via `@theme inline`.

## Color tokens

### Brand

| Token | Hex | Use |
|---|---|---|
| `--navy-900` | `#0D2A4D` | Sidebar, primary buttons, header bar |
| `--navy-800` | `#143461` | Hover on primary |
| `--navy-700` | `#1A3D6C` | Focus rings, secondary surfaces |
| `--navy-50` | `#E7EEF8` | Subtle navy bg (e.g. avatar wells) |
| `--saffron-500` | `#F59E0B` | Brand accent — keep ≤ 10% of any surface |
| `--saffron-400` | `#FBBF24` | Hover/lighter accent |
| `--saffron-300` | `#FCD34D` | Accent border, selection background |
| `--saffron-50` | `#FEF6E5` | AI Explain panel, KPI accent backgrounds |

**Rule:** saffron is a spotlight, not a fill. If you find yourself filling a button or a card with saffron, stop — use it as a border, an icon, or a thin background for a specific AI/accent context only.

### Ink

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#0F172A` | Primary body text, headings |
| `--ink-800` | `#1E293B` | Strong secondary |
| `--ink-700` | `#334155` | Narrative body, table content |
| `--ink-500` | `#64748B` | Labels, captions, metadata |
| `--ink-400` | `#94A3B8` | Placeholder text |
| `--ink-300` | `#CBD5E1` | Subtle dividers, scrollbar thumb |

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--bg-app` | `#F7F8FB` | App background (cool, never cream) |
| `--bg-surface` | `#FFFFFF` | Cards, tables, sheets |
| `--bg-surface-2` | `#FAFBFC` | Sub-surfaces (table rows, table headers) |
| `--bg-hover` | `#F0F3F8` | Row hover |
| `--bg-pressed` | `#E7ECF2` | Pressed state |

### Borders

| Token | Hex | Use |
|---|---|---|
| `--border` | `#E4E7EC` | All 1px borders |
| `--border-strong` | `#CFD6DD` | Stronger dividers, dropzones |
| `--border-focus` | `var(--navy-700)` | Focus ring colour |

### Status — always paired with a dot + label

| Status | Bg | Fg | Border | Dot |
|---|---|---|---|---|
| `ok` | `#E7F6ED` | `#15803D` | `#BBF7D0` | `#16A34A` |
| `warn` | `#FEF3C7` | `#92400E` | `#FDE68A` | `#D97706` |
| `bad` | `#FEE2E2` | `#991B1B` | `#FECACA` | `#DC2626` |
| `info` | `#DBEAFE` | `#1E40AF` | `#BFDBFE` | `#2563EB` |
| `neutral` | `#F1F5F9` | `#334155` | `#CBD5E1` | `#64748B` |

**Rule:** every status pill renders a coloured dot **and** a label. Color alone is never the signal. `bad` (red) is reserved for CRITICAL severity and is muted by intent — we never use pure red as a button fill.

## Typography

- **UI font:** Archivo (loaded via `next/font/google`, exposed as `--font-archivo`). Fallback Inter, then system-ui.
- **Mono font:** JetBrains Mono with `font-variant-numeric: tabular-nums`. Use for **all** numbers, IDs, timestamps, cycles.
- **Currency:** `₹` glyph + `en-IN` grouping (`₹1,23,45,678`). Summaries use lakh/crore via `formatInrCompact` (`₹14.80 L`, `₹1.48 Cr`).

### Scale

| Token | Size | Use |
|---|---|---|
| `--text-2xs` | 11px | Pill labels, micro-copy |
| `--text-xs` | 12px | Captions, table headers (uppercase) |
| `--text-sm` | 13px | Body table content, narratives |
| `--text-base` | 14px | Body text, form inputs |
| `--text-md` | 15px | Section headings inline |
| `--text-lg` | 17px | Card titles |
| `--text-xl` | 20px | Page subheads |
| `--text-2xl` | 24px | Page H1 |
| `--text-3xl` | 28px | KPI values (with Mono) |
| `--text-4xl` | 40px | Hero numbers (rare) |

## Spacing + radii

- Spacing rhythm is multiples of 4. Use the `--space-*` ladder.
- Card radius is `--radius-card: 10px`. Razorpay sits in the 8–12px range; 10 is our anchor.
- Pills: full radius (999px).
- Inputs/buttons: 6–8px.

## Shadows

- `--shadow-card` is the only shadow most cards need. It's deliberately subtle (two 1px-blur layers at 4–6% alpha). Never floaty.
- `--shadow-md` for elevated surfaces (drawers, hovered KPI tiles).
- `--shadow-lg` for the rare modal.

## Component patterns

### KPI tile

```
┌──────────────────────────────┐
│ APR PAYOUT       ↑ +4.1%     │
│                              │
│  ₹4.87 Cr                    │
│                              │
│ vs Mar           ⋮⋮⋮⋮⋮⋮⋮     │
└──────────────────────────────┘
```

- Label: 12px, uppercase, tracking-wide, `--ink-500`.
- Value: 28px **JetBrains Mono**, tabular nums, `--ink-900`.
- Delta: badge with ↑/↓/—, green/red/neutral status colours.
- Sparkline: 88×24, `--navy-600` 1.5px stroke.
- `accent` variant adds a `--saffron-300` 1px ring (for "Open anomalies" or attention-grabbing KPIs).

### Anomaly card

```
┌────────────────────────────────────────────────────────────┐
│ ● [CRITICAL] EMP-0142 net pay 2× the trailing-12 median    │
│                                                            │
│ EMP-0142 (Aarav Mehta) shows ₹2,04,800 net in Apr 2026 —   │
│ exactly 2× the 12-month median of ₹1,02,400. A CORRECTION  │
│ run on 2026-04-28 reprocessed the same line as the …       │
│                                                            │
│ [PL-A4F2]  [EMP-0142]            conf ▌▌▌▌▌   [✨ Explain ›]│
└────────────────────────────────────────────────────────────┘
```

- Severity: coloured dot + StatusPill label (CRITICAL/HIGH/MEDIUM/LOW).
- Citations: Mono chips, deep-link to records.
- Confidence: 5 tick blocks, filled to level.
- Explain: saffron-50 button with `Sparkles` icon → opens 380px right drawer.

### Data table

- TanStack Table.
- Sticky header on `--bg-surface-2`.
- Row height 44px.
- Numeric columns right-aligned in JetBrains Mono.
- Hover row: `--bg-hover` with a 2px saffron left edge (optional).
- CSV export icon top-right of every table.

### AI Explain panel

- 380px drawer from the right.
- `--saffron-50` background with `Sparkles` Lucide icon in `--saffron-500`.
- Narrative body in `--ink-700` 14px.
- Citations rendered as Mono chips linking to records.
- Confidence meter at the top.
- "Acknowledge" + "Dismiss with reason" actions at the bottom.

### Status pill

- Dot 6px + label 11px.
- Use the `tone` prop; never override colours inline.
- Variants: ok, warn, bad, info, neutral.

### Confidence meter

- 5 ticks, each 1×10px, filled to `level` in `--navy-700`.
- Tooltip: "Confidence N/5".

### Empty states

- Declarative ("No anomalies in this cycle. The cycle is clean.").
- No exclamation marks. No marketing voice. No huge illustrations.

## Anti-patterns (zero tolerance)

- ❌ Cream backgrounds (`#FFF7E1`, `#FFFBEB`).
- ❌ Three-card hero on the landing page.
- ❌ Side-stripe coloured card borders.
- ❌ Status by colour alone (every pill needs a dot **and** a label).
- ❌ Red destructive buttons by default — use muted `--bad-bg` + `--bad-fg` text, or move destructive actions into a confirm drawer.
- ❌ Marketing-voice empty states ("Oops! Looks like…").
- ❌ Spinners where a skeleton fits.
- ❌ Exclamation marks anywhere in UI copy.
- ❌ Mixed icon families (Lucide only; never Feather + Lucide + Tabler).
- ❌ Modals for multi-step work — modals are for confirmations and brief single steps. Use a drawer or a dedicated page for anything multi-step.

## Component inventory (V1)

In `components/`:
- `chrome/Sidebar`, `chrome/Topbar`, `chrome/ComingSoon`
- `kpi/KpiTile`
- `anomaly/AnomalyCard`, `anomaly/AnomalyDrawer` (W3)
- `status/StatusPill`
- `money/InrAmount` (W2), `money/InrInput` (W2)
- `tables/DataTable` (W2), `tables/columns/*`
- `charts/MoneyChart` (W3), `charts/VarianceBar` (W5)
- `chat/AskComposer`, `chat/MessageList`, `chat/CitationChip` (W6)
- `upload/DropZone`, `upload/ParsePreview` (W2)

## Razorpay patterns to mimic explicitly

- **Payments table:** sticky header, status pill, JetBrains Mono amounts right-aligned, hover row tint, CSV export top-right.
- **Settlement card:** tight padding, value 28px Mono, label 12px ink-500, sparkline.
- **Webhook card pattern** (for our Connector cards): icon avatar left, status pill right, "Last sync" + "Scope" metadata grid, action buttons in a footer separated by a 1px top border.
- **Empty filter state:** small Lucide icon + 14px line + a single CTA.

## Stripe patterns to mimic

- **Details on the right, not modal:** clicking a row opens a 380px drawer on the right with focus shift, not a modal that hijacks the page.
- **Calm typography hierarchy:** strong rhythm of 12 / 14 / 17 / 28 — no in-between sizes.

## What we won't borrow

- Linear's dark mode — too risky for a finance-team demo.
- Notion's soft cream — clashes with status colours and looks unprofessional in screenshots.
- Material's heavy shadows — too floaty for utility UI.
