---
version: alpha
name: Chanakya-design-language
description: An inspired interpretation of Stripi's design language — financial-infrastructure brand built on a deep navy ink, an electric indigo primary, and a recurring atmospheric gradient mesh that occupies the upper third of marketing pages. The system pairs an Inter substitute for Sohne at thin (300) weights with negative letter-spacing for editorial-density display headlines, and uses tabular-figure body type where money and numerics matter. Buttons are tight-radius pills, cards live on near-white surfaces, and the dashboard track inherits the same canvas but tightens density. Status semantics (ok/warn/bad) survive into the operations shell because Chanakya is a dashboard product, not a marketing surface.

colors:
  primary: "#533afd"
  primary-deep: "#4434d4"
  primary-press: "#2e2b8c"
  primary-soft: "#665efd"
  primary-bg-subdued-hover: "#b9b9f9"
  brand-dark-900: "#1c1e54"
  ink: "#0d253d"
  ink-secondary: "#273951"
  ink-mute: "#64748d"
  ink-mute-2: "#61718a"
  on-primary: "#ffffff"
  canvas: "#ffffff"
  canvas-soft: "#f6f9fc"
  canvas-cream: "#f5e9d4"
  hairline: "#e3e8ee"
  hairline-input: "#a8c3de"
  ruby: "#ea2261"
  magenta: "#f96bee"
  lemon: "#9b6829"
  shadow-blue: "#003770"
  ok: "#1f6a3c"
  ok-bg: "#e7f6ed"
  warn: "#92400e"
  warn-bg: "#fef3c7"
  bad: "#991b1b"
  bad-bg: "#fee2e2"
  info: "#1e40af"
  info-bg: "#dbeafe"

typography:
  display-xxl: { fontSize: 56px, fontWeight: 300, lineHeight: 1.03, letterSpacing: -1.4px }
  display-xl:  { fontSize: 48px, fontWeight: 300, lineHeight: 1.15, letterSpacing: -0.96px }
  display-lg:  { fontSize: 32px, fontWeight: 300, lineHeight: 1.1,  letterSpacing: -0.64px }
  display-md:  { fontSize: 26px, fontWeight: 300, lineHeight: 1.12, letterSpacing: -0.26px }
  heading-lg:  { fontSize: 22px, fontWeight: 300, lineHeight: 1.1,  letterSpacing: -0.22px }
  heading-md:  { fontSize: 20px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: -0.2px }
  heading-sm:  { fontSize: 18px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: 0 }
  body-lg:     { fontSize: 16px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: 0 }
  body-md:     { fontSize: 15px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: 0 }
  body-tabular:{ fontSize: 14px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: -0.42px, fontFeature: "tnum" }
  button-md:   { fontSize: 16px, fontWeight: 400, lineHeight: 1.0,  letterSpacing: 0 }
  button-sm:   { fontSize: 14px, fontWeight: 400, lineHeight: 1.0,  letterSpacing: 0 }
  caption:     { fontSize: 13px, fontWeight: 400, lineHeight: 1.4,  letterSpacing: -0.39px, fontFeature: "tnum" }
  micro:       { fontSize: 11px, fontWeight: 300, lineHeight: 1.4,  letterSpacing: 0 }
  micro-cap:   { fontSize: 10px, fontWeight: 400, lineHeight: 1.15, letterSpacing: 0.1px }

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px
---

## Overview

Chanakya's design language opens with the gradient mesh on the `/login` page and the marketing surfaces. A wide horizontal band of pastel cream, sherbet orange, lavender, electric indigo, and ruby pink occupies the upper third — the brand's atmospheric backdrop borrowed from the Stripi family. Type and product UI mockups float above it on **canvas** (white), with the gradient acting as both decoration and visual anchor. The authenticated app track returns to white, with feature explanations on **canvas-soft** (a barely-tinted cool off-white) and dense operations tables.

The color system has two primary roles. **Indigo** (`primary` — `#533afd`) is the brand's signature CTA color, used sparingly: one filled pill per band. **Deep navy** (`ink` — `#0d253d`) is the universal body text color and the fill of the sidebar, the featured pricing tier, and dark surfaces. Ruby (`ruby`) and magenta (`magenta`) appear inside the gradient mesh and as accent dots in product UI mockups; they are not used as button colors. Anomaly severity colors live in a separate `ok/warn/bad/info` system carried over from operations needs.

Typography is built around **Inter** at weight 300 with negative letter-spacing (the open-source substitute for Sohne, the brand's proprietary face). Display sizes (32–56px) use -1.4px to -0.64px tracking; body sizes use 0; tabular caption sizes (where money and numerics matter) use the OpenType `tnum` feature plus a tightening -0.36 to -0.42px tracking. The `ss01` stylistic set is enabled globally.

**Key Characteristics:**

- Gradient-mesh backdrop on `/login` and any future marketing surface — cream / orange / lavender / indigo / ruby horizontally washed across the upper third of the page.
- Single-indigo CTA hierarchy: filled `primary` pill is the only filled button on marketing surfaces. Inside the app, indigo is the action verb (Acknowledge, Generate register, Sign in).
- Inter thin (weight 300) display tier with negative tracking from -1.4px to -0.2px depending on size.
- Tabular-figure body type (`tnum`) for any cell containing money or numerics — the brand's quiet financial-data signal. Combined with INR `en-IN` grouping and lakh/crore for compact summaries.
- Composited dashboard mockups (faux IDE / terminal / dashboard chrome) sit on white canvas with subtle Level 2 shadow.
- Pill-shaped buttons (`rounded.pill` 9999px) with tight `8px 16px` padding — short, decisive, transactional.
- Cream-band feature cards (`canvas-cream`) introduce a warm interlude between indigo/white sections.
- Status semantics preserved (ok/warn/bad/info) — Chanakya is mostly dashboard, so anomaly severity needs a fixed semantic system on top of the marketing palette.

---

## Colors

### Brand & Accent

| Token | Hex | Use |
|---|---|---|
| `primary` | `#533afd` | Filled CTA, link emphasis, gradient anchor, AI affordance icon |
| `primary-deep` | `#4434d4` | Gradient mid-stops, button hover, pressed-state warmer alternative |
| `primary-press` | `#2e2b8c` | Pressed-state lift of the primary button |
| `primary-soft` | `#665efd` | Product UI accents, chart highlights |
| `primary-bg-subdued-hover` | `#b9b9f9` | Pale indigo fill for soft tags, AI background panels |
| `brand-dark-900` | `#1c1e54` | Featured pricing tier, dashboard chrome, sidebar fill |
| `ruby` | `#ea2261` | Gradient accent and chart highlight; never a button |
| `magenta` | `#f96bee` | Brighter pink stop in gradient meshes |
| `lemon` | `#9b6829` | Warm sherbet stop in gradient backdrops |

### Surface

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#ffffff` | Default page background, card fills |
| `canvas-soft` | `#f6f9fc` | Cool-tinted off-white feature bands, app shell |
| `canvas-cream` | `#f5e9d4` | Warm cream feature-band fill — chromatic interlude |
| `hairline` | `#e3e8ee` | 1px borders on cards and tables |
| `hairline-input` | `#a8c3de` | Slightly cooler hairline for form inputs |

### Text

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0d253d` | Default body text. Deep navy, never pure black |
| `ink-secondary` | `#273951` | Secondary text on white |
| `ink-mute` | `#64748d` | Helper text, captions, table labels |
| `ink-mute-2` | `#61718a` | Near-equivalent for nav |
| `on-primary` | `#ffffff` | Text on indigo / dark-navy surfaces |

### Semantic (Chanakya-specific addition)

The Stripi marketing system does not use a separate semantic palette — error/success states live in dashboard-product UI specifically. Chanakya IS the dashboard, so we hold these explicitly:

| Token | Bg / Fg | Use |
|---|---|---|
| `ok` | `#e7f6ed` / `#1f6a3c` | OPEN cycle, healthy connector, ACK pill |
| `warn` | `#fef3c7` / `#92400e` | HIGH severity, DEGRADED connector, variance over threshold |
| `bad` | `#fee2e2` / `#991b1b` | CRITICAL severity, DISCONNECTED, dismiss action |
| `info` | `#dbeafe` / `#1e40af` | OPEN anomaly status, LOCKED cycle, MEDIUM severity |
| `neutral` | `#f1f5f9` / `#334155` | DISMISSED, NEVER synced, LOW severity |

**Rule:** status is always rendered as **dot + label**. Color alone is never the signal. Severity dots are 8–12px on cards, 6px on inline pills.

---

## Typography

### Font Family

The display and UI tier is **Inter** (open-source via Google Fonts) at weights 300 (thin) and 400 (regular). The variable font is loaded with `font-feature-settings: "ss01"` enabled globally — `ss01` substitutes a single-story `a` and other character variants that are part of the brand's typographic signature.

When Inter is unavailable, fall back to SF Pro Display at thin weights, then `system-ui`. **Note:** the canonical Stripi family is Sohne (proprietary, licensed from Klim Type Foundry). Inter is the closest open-source analogue and is what we ship.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `display-xxl` | 56px | 300 | 1.03 | -1.4px | Hero headline (marketing) |
| `display-xl` | 48px | 300 | 1.15 | -0.96px | Section opener |
| `display-lg` | 32px | 300 | 1.1 | -0.64px | Card title / sub-section |
| `display-md` | 26px | 300 | 1.12 | -0.26px | Compact card title; **also: KPI value** |
| `heading-lg` | 22px | 300 | 1.1 | -0.22px | Pricing tier name; cycle page H1 |
| `heading-md` | 20px | 300 | 1.4 | -0.2px | Section sub-heading; module page H1 |
| `heading-sm` | 18px | 300 | 1.4 | 0 | Mini-section label |
| `body-lg` | 16px | 300 | 1.4 | 0 | Marketing body lead |
| `body-md` | 15px | 300 | 1.4 | 0 | Default UI body |
| `body-tabular` | 14px | 300 | 1.4 | -0.42px | Money / numeric tables (`tnum`) |
| `button-md` | 16px | 400 | 1.0 | 0 | Pill button label |
| `button-sm` | 14px | 400 | 1.0 | 0 | Compact pill label |
| `caption` | 13px | 400 | 1.4 | -0.39px | Helper, table labels (`tnum`) |
| `micro` | 11px | 300 | 1.4 | 0 | Fine print |
| `micro-cap` | 10px | 400 | 1.15 | 0.1px | All-caps eyebrow |

### Principles

- **Thin weight is the brand.** Display tiers always render at weight 300. Bumping to 400+ removes the brand's editorial air.
- **Negative tracking on display.** -1.4px at 56px, scaling proportionally down to -0.2px at 20px.
- **Tabular figures for money.** Any cell rendering currency, transaction amounts, employee counts, or row counts uses `font-feature-settings: "tnum"` plus a tightening tracking.
- **`ss01` globally.** Apply `font-feature-settings: "ss01"` to the body element so the stylistic-set substitution is on for every text role.
- **No more JetBrains Mono.** Tabular figures via `tnum` replace the monospace font for money. The visual difference is subtle but the brand reads cleaner.

### Currency conventions (Chanakya addition)

- Use the `₹` glyph, never "Rs" or "INR".
- `en-IN` grouping: `₹1,02,400`, `₹1,23,45,678`.
- Summaries use lakh/crore compact: `₹1.48 Cr`, `₹14.80 L`.
- All currency cells set `font-variant-numeric: tabular-nums` (CSS) or `font-feature-settings: "tnum"`.
- Paise stored as integer BigInt; display always in rupees.

---

## Layout

### Spacing System
- **Base unit**: 8px (with 2 / 4 / 12 sub-tokens for fine work).
- **Tokens**: `xxs` 2px · `xs` 4px · `sm` 8px · `md` 12px · `lg` 16px · `xl` 24px · `xxl` 32px · `huge` 64px.
- **Section padding**: 64–96px on marketing surfaces (`/login` hero); 24–32px on app surfaces (every other page).
- **Card internal padding**: 32px on feature cards; 24px on dashboard mockups; 20px on dense KPI tiles.

### Grid & Container
- Marketing pages center in a 1200px container with the gradient mesh extending edge-to-edge.
- App pages center in a 1400px container with sidebar offset.
- Pricing collapses 4-up → 2-up → 1-up at 1024 / 768 breakpoints.
- Module pages use their own internal grids (sidebar 240px fixed + flex-1 main).

### Whitespace philosophy
The gradient mesh occupies the upper third of marketing pages; the white canvas below is generously padded. Inside the app, density tightens — section gaps shrink to 24px, content rhythm becomes more transactional. The brand is calm on the way in and tightly utilitarian once you're working.

---

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat | Default surface |
| 1 | `box-shadow: rgba(0,55,112,0.08) 0 1px 3px` | Card lift on white |
| 2 | `box-shadow: rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px` | Floating panels, dashboard mockup chrome, drawers |
| 3 | Gradient mesh backdrop | Brand's primary depth medium — atmospheric color, not literal shadow |

### Decorative depth
The gradient mesh IS the marketing-surface depth system. Implemented as a layered SVG or large background image rather than CSS gradients (the real mesh has organic blob shapes that aren't CSS-renderable). The mesh provides the brand's signature lift on `/login`; literal shadows are reserved for product-UI mockups and stay subtle.

---

## Shapes

### Border radius scale

| Token | Value | Use |
|---|---|---|
| `rounded.xs` | 4px | Hairline tags, table chrome |
| `rounded.sm` | 6px | Form inputs |
| `rounded.md` | 8px | Compact cards, alerts |
| `rounded.lg` | 12px | Pricing cards, feature cards, KPI tiles |
| `rounded.xl` | 16px | Dashboard product mockup chrome, drawer corners |
| `rounded.pill` | 9999px | **All buttons, tag pills, status pills** |

---

## Components

### Buttons

**`button-primary-pill`** — the dominant CTA system-wide.
- Background `primary`, text `on-primary`, type `button-md`, padding `8px 16px`, rounded `pill`.
- Pressed `primary-press`.
- Hover: subtle 1px upward lift via `transform: translateY(-1px)` if motion is allowed.

**`button-secondary`** — outline-style alternative.
- Background `canvas`, text `primary`, 1px solid `primary` border, same pill geometry.

**`button-on-dark`** — used on dashboard / dark surfaces (sidebar, dark cards).
- Background `brand-dark-900`, text `on-primary`, same pill geometry.

**`button-ghost`** — for tertiary actions on light surfaces.
- Background transparent, text `ink-mute` → `ink` on hover.

### Cards & Containers

**`card-feature-light`** — feature explanation card on white.
- Background `canvas`, padding `32px`, rounded `lg` (12px), 1px `hairline` border, optional Level 1 shadow.

**`card-pricing`** — standard pricing tier (currently unused; reserved for future marketing).
- Background `canvas`, padding `32px`, rounded `lg`, 1px `hairline` border. Title `heading-lg`, price `display-md`, body `body-md`, CTA pinned bottom as `button-primary-pill`.

**`card-pricing-featured`** — inverted dark featured tier.
- Background `brand-dark-900`, text `on-primary`, otherwise identical structure to `card-pricing`.

**`card-cream-band`** — warm interlude card.
- Background `canvas-cream`, text `ink`, padding `32px`, rounded `lg`. Use to break up the indigo / white rhythm.

**`card-kpi`** — Chanakya-specific. Dense metric tile.
- Background `canvas`, padding `20px`, rounded `lg`, 1px `hairline` border, no shadow.
- Label: `micro-cap` uppercase tracking-wide ink-mute.
- Value: `display-md` (26px thin) ink, tabular figures.
- Delta chip: tabular caption with up/down chevron in `ok` / `bad`.

**`card-dashboard-mockup`** — composited dashboard / product UI screenshot.
- Background `canvas`, type `body-tabular` (with `tnum`), padding `24px`, rounded `lg`, Level 2 shadow.

### Inputs & Forms

**`text-input`** — standard form field.
- Background `canvas`, text `ink`, type `body-md`, padding `8px 12px`, rounded `sm` (6px), 1px `hairline-input` border.
- Focus: border swaps to `primary`.

### Navigation

**`nav-bar-on-mesh`** — top nav floating over the gradient hero.
- Background `canvas` (or transparent depending on scroll), text `ink`, padding `16px 24px`. Wordmark left, primary nav center, sign-in + filled `button-primary-pill` right.

**`sidebar-dark`** — Chanakya app shell sidebar.
- Background `brand-dark-900` (`#1c1e54`), text `on-primary`, width `240px`, padding `16px` top and bottom.
- Active nav item: `bg: rgba(255,255,255,0.08)`, icon tint `primary-soft`.
- Cycle status footer pinned bottom with `micro` text.

### Pills, Tags, and Chips

**`pill-tag-soft`** — subdued indigo tag.
- Background `primary-bg-subdued-hover` (`#b9b9f9`), text `primary-deep`, type `micro-cap`, padding `4px 8px`, rounded `pill`.

**`pill-status`** — Chanakya status pill (ok/warn/bad/info/neutral).
- Background `{tone}-bg`, text `{tone}-fg`, dot + label, type `micro-cap`, padding `2px 8px`, rounded `pill`.
- The dot is the semantic — color alone is never the signal.

### Signature components

**Gradient Mesh Backdrop** — pastel cream → sherbet orange → lavender → indigo → ruby pink stops blurred horizontally across the upper third of the page. Implemented as SVG or a large background image — not a flat CSS gradient. Used on `/login` and any future marketing surface.

**Composited Dashboard Mockup** — multi-layer faux-product-UI compositions: an IDE panel on the left, a dashboard table center, a chart card on the right, all rendered at small scale inside `rounded.lg` containers with subtle Level 2 shadows. Reserved for marketing surfaces; the actual app *is* the dashboard, so it doesn't need a "mockup of itself."

**Tabular-Figure Money Type** — every number rendering money, count, or transaction value uses `font-feature-settings: "tnum"`. Plus `₹` glyph and `en-IN` grouping.

**`link-on-light`** — inline links on light surfaces.
- Text `primary` rendered in `body-md`, no underline by default. Underline on hover via `decoration-thickness: 1px` and `text-underline-offset: 2px`.

**`footer-light`** — site-wide footer.
- Background `canvas`, text `ink-mute`, type `caption`, padding `64px 24px`.

---

## AI affordances (Chanakya addition)

Stripi has no "AI" surface — Chanakya does. We anchor AI affordances on indigo, not a separate accent:

- **Sparkles icon** → `primary` (was saffron in the previous register).
- **Explain drawer** → `canvas-soft` background, `primary-bg-subdued-hover` left border, Sparkles in `primary`.
- **AI snapshot text on the dashboard** → inline `primary` Sparkles icon followed by `body-md` ink-secondary.
- **Ask Chanakya panel** → `canvas` background, `primary-bg-subdued-hover` 1px border, indigo Sparkles header.
- **AI badge in sidebar** (`Ask`, `Demo tour` entries) → tiny indigo pill `primary-bg-subdued-hover` background, `primary-deep` text.

The `saffron` family is RETIRED. No `#F59E0B`, no `#FEF6E5`. If you find a saffron token in code, it's stale — replace with `primary` or `primary-bg-subdued-hover`.

---

## Do's and Don'ts

### Do
- Reserve `primary` for filled CTAs and inline link emphasis — appear sparingly, one filled button per band.
- Apply the gradient mesh to the `/login` hero; future marketing surfaces should match.
- Render display tiers at weight 300 with negative letter-spacing.
- Use `font-feature-settings: "tnum"` on every money / numeric cell.
- Apply `font-feature-settings: "ss01"` globally on the body element.
- Use pill geometry on every button (rounded.pill = 9999px).
- Use the dot+label status pill — color alone is never the signal.

### Don't
- Don't bump display weight above 300 — at 400 the brand's editorial air collapses.
- Don't add new accent colors outside the documented gradient stops.
- Don't use `primary` as a body-text color — it's a CTA and link color.
- Don't shrink button padding below `8px 16px` — the tight pill is part of the brand.
- Don't render money cells without `tnum` — it breaks the quiet financial-data signature.
- Don't use rounded-rectangles for buttons — pill is the only allowed button shape.
- Don't use JetBrains Mono anywhere — `tnum` on Inter handles money. Mono is retired.
- Don't use the saffron palette — it's retired. Use `primary` for AI affordances.
- Don't render full-page-width cream bands except as deliberate chromatic interludes.

---

## Responsive behavior

### Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Wide | ≥ 1440px | Full gradient mesh edge-to-edge; KPI grid 4-up |
| Desktop | 1024–1440px | Default content max-width; KPI grid 4-up |
| Tablet | 768–1023px | KPI grid 2-up; sidebar collapses to icons-only |
| Mobile | < 768px | KPI grid 1-up; sidebar becomes drawer; display drops 56 → 36px |

### Touch targets
- Pill buttons hit ≥ 40×40px on mobile via padding scaling.
- Form fields stay at 40px minimum height.

### Collapsing strategy
- Display tiers stair-step 56 → 48 → 32 → 26 → 22px through the breakpoints.
- Gradient mesh re-tiles on mobile to preserve the wash without disappearing.
- KPI grid: 4-up → 2-up → 1-up.
- Anomaly cards: full-width on mobile, no horizontal scroll.

---

## Iteration guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly (`primary`, `button-primary-pill-pressed`, `rounded.pill`).
3. Default body to `body-md` (15px); use `body-tabular` for any money / numeric cell.
4. Apply `ss01` globally on the body; apply `tnum` per-element on numeric content.
5. The gradient mesh is non-negotiable on `/login` — bare-canvas login pages break the brand.
6. Status semantics (ok/warn/bad/info) are non-negotiable in the app — this is a finance product.

---

## What changed from the previous register (Razorpay-style)

| Was | Is |
|---|---|
| `#0D2A4D` navy + `#F59E0B` saffron | `#533afd` indigo + `#1c1e54` brand-dark-900 |
| Archivo + JetBrains Mono | Inter @ 300 with `ss01` + `tnum` on money cells |
| Card radius 10px | Card radius 12px (`rounded.lg`) |
| Buttons rounded-md (6–8px) | Buttons pill (9999px) |
| Saffron Sparkles for AI affordances | Indigo Sparkles for AI affordances |
| Cool-gray app bg `#F7F8FB` | Canvas-soft `#f6f9fc` |
| Bold/semibold-weighted display | Thin (300) display with negative letter-spacing |

Status colors, dot+label pills, INR formatting (`₹` + en-IN grouping + lakh/crore), and the audit-immutability discipline carry over unchanged.
