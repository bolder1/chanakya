/**
 * Money + date + identity formatters for Chanakya.
 *
 * Money is stored as integer paise (× 100). Display layer never sees floats.
 * Currency uses en-IN grouping (1,23,45,678 — lakh/crore commas).
 */

const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrNumber = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paise as full INR — `₹1,23,45,678`. Drops fractional paise. */
export function formatInr(paise: number | bigint): string {
  const rupees =
    typeof paise === "bigint"
      ? Number(paise / BigInt(100))
      : Math.round(Number(paise) / 100);
  return inrFull.format(rupees);
}

/** Format paise with two-decimal paise — `₹1,23,45,678.50`. */
export function formatInrWithPaise(paise: number | bigint): string {
  const rupees = typeof paise === "bigint" ? Number(paise) / 100 : Number(paise) / 100;
  return inrWithPaise.format(rupees);
}

/**
 * Compact INR for summaries — uses Indian numbering conventions:
 *   < 1L      → `₹95,000`
 *   1L–<1 Cr  → `₹14.80 L`
 *   ≥ 1 Cr    → `₹1.48 Cr`
 */
export function formatInrCompact(paise: number | bigint): string {
  const n = typeof paise === "bigint" ? Number(paise) / 100 : Number(paise) / 100;
  const abs = Math.abs(n);
  if (abs >= 1e7) {
    return `₹${(n / 1e7).toFixed(2)} Cr`;
  }
  if (abs >= 1e5) {
    return `₹${(n / 1e5).toFixed(2)} L`;
  }
  return `₹${inrNumber.format(Math.round(n))}`;
}

/** Format a raw integer with en-IN grouping (no ₹). */
export function formatNumberIn(n: number): string {
  return inrNumber.format(n);
}

/** Signed percentage delta — `+12.4%` / `−5.0%` (uses true minus glyph). */
export function formatPct(delta: number, digits: number = 1): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta).toFixed(digits)}%`;
}

const dateLong = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeLong = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeOnly = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string): string {
  return dateLong.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeLong.format(new Date(d));
}

export function formatTime(d: Date | string): string {
  return timeOnly.format(new Date(d));
}

/** Relative time — `2 min ago`, `3 hours ago`. Falls back to date for >7 days. */
export function formatRelative(d: Date | string): string {
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  return formatDate(date);
}

/** Cycle label — `2026-04` → `Apr 2026`. Returns input unchanged if malformed. */
export function formatCycle(label: string): string {
  const m = label.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return label;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return label;
  const d = new Date(year, month - 1, 1);
  if (isNaN(d.getTime())) return label;
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(d);
}
