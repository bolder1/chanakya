/**
 * Normalize messy real-world Excel cells into clean typed values.
 *
 * Real MiniOrange sheets land with:
 *   - `₹ 1,02,400.00` instead of 102400
 *   - `5 nos`, `12.5 kg` instead of plain numbers
 *   - `11-07-2022`, `11/07/2022`, `2022-07-11` instead of Date objects
 *   - Header rows preceded by 1–3 blank rows
 *   - Merged header cells (we read the leftmost only)
 *   - Trailing "Total" / "Grand Total" rows
 *   - REIMBURSTMENT (sic), Accomodation (sic) — handled via alias maps
 */

/** Strip INR, commas, currency symbols; return number or null. */
export function parseInr(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") return Math.round(cell * 100); // assume ₹ as float
  if (typeof cell !== "string") return null;
  const cleaned = cell.replace(/[₹$,\s]/g, "").replace(/\.00$/, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100); // → paise
}

/** Parse INR but keep as paise integer (BigInt-safe). */
export function parseInrPaise(cell: unknown): bigint | null {
  const n = parseInr(cell);
  if (n === null) return null;
  return BigInt(n);
}

/** Strip non-numeric suffixes — "5 nos" → 5, "12.5 kg" → 12.5. */
export function parseQty(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") return cell;
  if (typeof cell !== "string") return null;
  const match = cell.trim().match(/^-?\d+(\.\d+)?/);
  if (!match) return null;
  return Number(match[0]);
}

/** Parse various date formats. Returns Date or null. */
export function parseDate(cell: unknown): Date | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (cell instanceof Date) return isNaN(cell.getTime()) ? null : cell;
  if (typeof cell === "number") {
    // Excel serial date (days since 1899-12-30)
    const ms = (cell - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof cell !== "string") return null;
  const s = cell.trim();
  if (!s) return null;
  // ISO: 2024-04-19
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // d/m/yyyy or dd-mm-yyyy
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Boolean: TRUE/FALSE/1/0/yes/no. */
export function parseBool(cell: unknown): boolean | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "boolean") return cell;
  if (typeof cell === "number") return cell !== 0;
  if (typeof cell !== "string") return null;
  const s = cell.trim().toLowerCase();
  if (["true", "yes", "y", "1", "t"].includes(s)) return true;
  if (["false", "no", "n", "0", "f"].includes(s)) return false;
  return null;
}

/** Normalize a header string: lowercase, strip non-alphanumerics, dedupe spaces. */
export function normalizeHeader(h: string): string {
  return h
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Given a 2D array of rows, find the first row that contains all required
 * header tokens (case-insensitive, ignoring spaces/punctuation). Returns
 * the header-row index, or -1 if not found.
 */
export function findHeaderRow(rows: unknown[][], required: string[]): number {
  const requiredNorm = required.map(normalizeHeader);
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const headers = row.map((c) => (c == null ? "" : normalizeHeader(String(c))));
    const ok = requiredNorm.every((r) => headers.includes(r));
    if (ok) return i;
  }
  return -1;
}

/** Given a header row, return a name → column-index map. */
export function indexHeaders(headerRow: unknown[]): Record<string, number> {
  const out: Record<string, number> = {};
  headerRow.forEach((cell, i) => {
    if (cell == null || cell === "") return;
    const key = normalizeHeader(String(cell));
    if (key && out[key] === undefined) out[key] = i;
  });
  return out;
}

/**
 * Try multiple alias spellings for a column name. First match wins.
 * Useful for the REIMBURSTMENT / REIMBURSEMENT / Accomodation / Accommodation typos.
 */
export function pickColumn(
  index: Record<string, number>,
  aliases: string[],
): number | undefined {
  for (const a of aliases) {
    const k = normalizeHeader(a);
    if (index[k] !== undefined) return index[k];
  }
  return undefined;
}

/** Is this row a footer/total row that we should skip? */
export function isFooterRow(row: unknown[]): boolean {
  if (!row || row.length === 0) return false;
  const first = row[0];
  if (typeof first !== "string") return false;
  return /^(total|grand total|sum|subtotal)$/i.test(first.trim());
}

/** Is the row entirely empty? */
export function isEmptyRow(row: unknown[]): boolean {
  if (!row) return true;
  return row.every((c) => c === null || c === undefined || c === "");
}
