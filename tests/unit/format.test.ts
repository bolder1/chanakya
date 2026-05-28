import { describe, it, expect } from "vitest";
import {
  formatInr,
  formatInrCompact,
  formatPct,
  formatCycle,
  formatRelative,
} from "@/lib/format";

describe("formatInr", () => {
  it("formats paise as INR with en-IN grouping", () => {
    expect(formatInr(102400_00)).toBe("₹1,02,400");
  });

  it("handles ₹1 Cr range with lakh/crore commas", () => {
    expect(formatInr(1_00_00_000_00)).toBe("₹1,00,00,000");
  });

  it("accepts BigInt input", () => {
    expect(formatInr(BigInt(102400_00))).toBe("₹1,02,400");
  });

  it("rounds fractional paise", () => {
    expect(formatInr(102400_50)).toBe("₹1,02,401");
  });

  it("formats zero", () => {
    expect(formatInr(0)).toBe("₹0");
  });
});

describe("formatInrCompact", () => {
  it("uses crore for amounts ≥ ₹1 Cr", () => {
    expect(formatInrCompact(7_09_33_967_00)).toBe("₹7.09 Cr");
  });

  it("uses lakh for amounts between ₹1 L and ₹1 Cr", () => {
    expect(formatInrCompact(14_80_000_00)).toBe("₹14.80 L");
  });

  it("uses plain INR for amounts < ₹1 L", () => {
    expect(formatInrCompact(95_000_00)).toBe("₹95,000");
  });

  it("handles BigInt", () => {
    expect(formatInrCompact(BigInt(7_09_33_967_00))).toBe("₹7.09 Cr");
  });
});

describe("formatPct", () => {
  it("formats positive with + prefix", () => {
    expect(formatPct(12.4)).toBe("+12.4%");
  });

  it("formats negative with minus glyph (not hyphen)", () => {
    expect(formatPct(-5.0)).toBe("−5.0%");
  });

  it("formats zero with no sign", () => {
    expect(formatPct(0)).toBe("0.0%");
  });

  it("respects the digits arg", () => {
    expect(formatPct(12.4567, 2)).toBe("+12.46%");
  });
});

describe("formatCycle", () => {
  it("converts 2026-04 to Apr 2026", () => {
    expect(formatCycle("2026-04")).toBe("Apr 2026");
  });

  it("returns input unchanged for malformed label", () => {
    expect(formatCycle("not-a-cycle")).toBe("not-a-cycle");
  });
});

describe("formatRelative", () => {
  it("returns 'just now' for sub-minute", () => {
    expect(formatRelative(new Date())).toBe("just now");
  });

  it("returns minutes for sub-hour", () => {
    const d = new Date(Date.now() - 15 * 60_000);
    expect(formatRelative(d)).toBe("15 min ago");
  });

  it("returns hours plural for ≥ 2 hours", () => {
    const d = new Date(Date.now() - 3 * 60 * 60_000);
    expect(formatRelative(d)).toBe("3 hours ago");
  });

  it("returns days for ≥ 1 day", () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60_000);
    expect(formatRelative(d)).toBe("2 days ago");
  });
});
