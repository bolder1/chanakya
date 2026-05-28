import { describe, it, expect } from "vitest";
import {
  parseInr,
  parseInrPaise,
  parseQty,
  parseDate,
  parseBool,
  normalizeHeader,
  findHeaderRow,
  indexHeaders,
  pickColumn,
  isFooterRow,
  isEmptyRow,
} from "@/lib/excel/messy";

describe("parseInr", () => {
  it("strips ₹ and commas", () => {
    expect(parseInr("₹1,02,400")).toBe(102400_00);
  });

  it("handles ₹ with spaces", () => {
    expect(parseInr("₹ 1,02,400.00")).toBe(102400_00);
  });

  it("treats number cells as float rupees", () => {
    expect(parseInr(1024)).toBe(1024_00);
  });

  it("returns null for empty", () => {
    expect(parseInr("")).toBe(null);
    expect(parseInr(null)).toBe(null);
    expect(parseInr(undefined)).toBe(null);
  });

  it("returns null for unparseable garbage", () => {
    expect(parseInr("abc")).toBe(null);
  });
});

describe("parseInrPaise", () => {
  it("returns BigInt", () => {
    const r = parseInrPaise("₹1,02,400");
    expect(typeof r).toBe("bigint");
    expect(r).toBe(BigInt(102400_00));
  });
});

describe("parseQty", () => {
  it("strips 'nos' suffix", () => {
    expect(parseQty("5 nos")).toBe(5);
  });

  it("handles decimal kg", () => {
    expect(parseQty("12.5 kg")).toBe(12.5);
  });

  it("preserves plain numbers", () => {
    expect(parseQty(7)).toBe(7);
  });

  it("returns null for non-numeric", () => {
    expect(parseQty("about a kilo")).toBe(null);
  });
});

describe("parseDate", () => {
  it("parses ISO yyyy-mm-dd", () => {
    const d = parseDate("2026-04-19");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(3); // April
    expect(d?.getDate()).toBe(19);
  });

  it("parses dd-mm-yyyy", () => {
    const d = parseDate("19-04-2026");
    expect(d?.getDate()).toBe(19);
    expect(d?.getMonth()).toBe(3);
    expect(d?.getFullYear()).toBe(2026);
  });

  it("parses d/m/yyyy", () => {
    const d = parseDate("9/4/2026");
    expect(d?.getDate()).toBe(9);
    expect(d?.getMonth()).toBe(3);
  });

  it("handles Excel serial numbers", () => {
    const d = parseDate(45797); // 2025-05-29 in Excel
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2025);
  });

  it("returns null for garbage", () => {
    expect(parseDate("not a date")).toBe(null);
  });
});

describe("parseBool", () => {
  it("recognizes TRUE/FALSE strings", () => {
    expect(parseBool("TRUE")).toBe(true);
    expect(parseBool("false")).toBe(false);
  });
  it("recognizes yes/no", () => {
    expect(parseBool("yes")).toBe(true);
    expect(parseBool("no")).toBe(false);
  });
  it("handles native booleans", () => {
    expect(parseBool(true)).toBe(true);
  });
});

describe("normalizeHeader", () => {
  it("lowercases and replaces non-alphanumerics", () => {
    expect(normalizeHeader("Employee No.")).toBe("employee_no");
  });

  it("handles MiniOrange's REIMBURSTMENT typo", () => {
    expect(normalizeHeader("REIMBURSTMENT")).toBe("reimburstment");
  });

  it("strips trailing punctuation noise", () => {
    expect(normalizeHeader("  Total  Pay  ")).toBe("total_pay");
  });
});

describe("findHeaderRow", () => {
  it("finds the header after blank rows", () => {
    const rows = [
      [],
      ["Header info"],
      ["Employee No", "Name", "BASIC", "NET PAY"],
      ["EMP-0001", "Alice", 50000, 45000],
    ];
    expect(findHeaderRow(rows, ["Employee No", "BASIC", "NET PAY"])).toBe(2);
  });

  it("returns -1 if headers not found", () => {
    const rows = [["col1", "col2", "col3"]];
    expect(findHeaderRow(rows, ["BASIC", "GROSS"])).toBe(-1);
  });

  it("is case-insensitive and punctuation-tolerant", () => {
    const rows = [["employee no.", "name", "basic", "net pay"]];
    expect(findHeaderRow(rows, ["Employee No", "BASIC"])).toBe(0);
  });
});

describe("pickColumn with aliases (REIMBURSTMENT/REIMBURSEMENT)", () => {
  it("matches whichever alias is present", () => {
    const cols = indexHeaders(["EmpID", "REIMBURSTMENT", "Total Pay"]);
    expect(pickColumn(cols, ["REIMBURSTMENT", "REIMBURSEMENT"])).toBe(1);
  });

  it("picks the first alias that hits", () => {
    const cols = indexHeaders(["Accomodation", "TOTAL"]);
    expect(pickColumn(cols, ["Accommodation", "Accomodation"])).toBe(0);
  });

  it("returns undefined when no alias matches", () => {
    const cols = indexHeaders(["col1", "col2"]);
    expect(pickColumn(cols, ["BASIC", "GROSS"])).toBe(undefined);
  });
});

describe("isFooterRow / isEmptyRow", () => {
  it("detects Total footer", () => {
    expect(isFooterRow(["Total", "", "", "₹50,000"])).toBe(true);
    expect(isFooterRow(["Grand Total", ""])).toBe(true);
  });
  it("treats data rows as not-footer", () => {
    expect(isFooterRow(["EMP-0001", "Alice", 50000])).toBe(false);
  });
  it("detects empty rows", () => {
    expect(isEmptyRow([null, null, "", undefined])).toBe(true);
    expect(isEmptyRow(["EMP-0001", null, null])).toBe(false);
  });
});
