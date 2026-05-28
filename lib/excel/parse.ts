/**
 * Excel parser entry point.
 *
 * Detects file kind by sheet names → payroll | attendance | shift | hostel |
 * invoices | procurement. Parses each sheet into typed rows + warnings.
 *
 * Output shape is what the preview page renders and what `commitUpload`
 * persists into ExcelUpload.summary.
 */

import * as XLSX from "xlsx";
import {
  findHeaderRow,
  indexHeaders,
  isEmptyRow,
  isFooterRow,
  parseBool,
  parseDate,
  parseInrPaise,
  parseQty,
  pickColumn,
} from "./messy";

export type UploadKind = "PAYROLL" | "ATTENDANCE" | "SHIFT" | "HOSTEL" | "INVOICES" | "PROCUREMENT";

export interface ParseWarning {
  sheet: string;
  row: number;
  column?: string;
  level: "WARN" | "ERROR";
  message: string;
}

export interface ParsedRow {
  rowIndex: number;
  fields: Record<string, string | number | boolean | null>;
  warnings: ParseWarning[];
}

export interface ParsedSheet {
  name: string;
  detectedKind?: UploadKind;
  rows: ParsedRow[];
  warnings: ParseWarning[];
  rowCount: number;
}

export interface ParsedFile {
  kind: UploadKind | "UNKNOWN";
  sheets: ParsedSheet[];
  rowCount: number;
  warningCount: number;
  errorCount: number;
  detectedReason: string;
}

const KIND_FINGERPRINTS: Array<{ kind: UploadKind; required: string[]; sheetNames: string[] }> = [
  {
    kind: "PAYROLL",
    sheetNames: ["payroll", "salary", "salary register", "monthly salary"],
    required: ["Employee No", "Name", "BASIC", "NET PAY"],
  },
  {
    kind: "ATTENDANCE",
    sheetNames: ["attendance", "att"],
    required: ["Employee No", "Name", "PRESENT DAYS"],
  },
  {
    kind: "SHIFT",
    sheetNames: ["shift", "shifts"],
    required: ["Employee No", "Name", "Night Shift", "Weekend"],
  },
  {
    kind: "HOSTEL",
    sheetNames: ["hostel", "hostel deduction", "guest house"],
    required: ["Employee Code", "Guest house", "Accomodation", "TOTAL"],
  },
  {
    kind: "INVOICES",
    sheetNames: ["invoices", "invoice", "vendor invoices"],
    required: ["Invoice_Number", "VendorCode", "Subtotal_INR"],
  },
  {
    kind: "PROCUREMENT",
    sheetNames: ["entries", "procurement", "spend"],
    required: ["Category_Name", "OccurredOn", "Total_INR"],
  },
];

export async function parseExcelBuffer(buf: ArrayBuffer | Buffer, filename: string): Promise<ParsedFile> {
  const wb = XLSX.read(buf, { cellDates: true, cellNF: false, cellStyles: false });
  const sheets: ParsedSheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null, raw: true });
    const parsed = parseSheet(sheetName, rows);
    sheets.push(parsed);
  }

  // File-level kind = the most common kind across non-empty sheets, or first
  const kinds = sheets.map((s) => s.detectedKind).filter((k): k is UploadKind => !!k);
  const kind: UploadKind | "UNKNOWN" = kinds.length > 0 ? kinds[0]! : "UNKNOWN";

  const rowCount = sheets.reduce((acc, s) => acc + s.rowCount, 0);
  const warningCount = sheets.reduce(
    (acc, s) => acc + s.warnings.filter((w) => w.level === "WARN").length + s.rows.reduce((a, r) => a + r.warnings.filter((w) => w.level === "WARN").length, 0),
    0,
  );
  const errorCount = sheets.reduce(
    (acc, s) => acc + s.warnings.filter((w) => w.level === "ERROR").length + s.rows.reduce((a, r) => a + r.warnings.filter((w) => w.level === "ERROR").length, 0),
    0,
  );

  return {
    kind,
    sheets,
    rowCount,
    warningCount,
    errorCount,
    detectedReason:
      kind === "UNKNOWN"
        ? `No known sheet structure recognized in ${filename}.`
        : `Detected ${kind} via sheet ${sheets.find((s) => s.detectedKind === kind)?.name ?? "?"}`,
  };
}

function parseSheet(sheetName: string, rows: unknown[][]): ParsedSheet {
  const sheetWarnings: ParseWarning[] = [];
  const parsedRows: ParsedRow[] = [];

  // Detect kind by sheet name + header tokens
  const detected = detectKindForSheet(sheetName, rows);
  const kind = detected.kind;

  if (!kind) {
    sheetWarnings.push({
      sheet: sheetName,
      row: 0,
      level: "WARN",
      message: `Sheet "${sheetName}" doesn't match any known template; skipping.`,
    });
    return { name: sheetName, rows: [], warnings: sheetWarnings, rowCount: 0 };
  }

  const headerIdx = detected.headerRowIndex;
  const headerRow = rows[headerIdx]!;
  const cols = indexHeaders(headerRow);

  // Parse data rows after the header
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || isEmptyRow(row)) continue;
    if (isFooterRow(row)) continue;

    try {
      const parsed = parseRowByKind(kind, row, cols, r);
      if (parsed) parsedRows.push(parsed);
    } catch (e) {
      sheetWarnings.push({
        sheet: sheetName,
        row: r + 1,
        level: "ERROR",
        message: `Failed to parse row: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return {
    name: sheetName,
    detectedKind: kind,
    rows: parsedRows,
    warnings: sheetWarnings,
    rowCount: parsedRows.length,
  };
}

function detectKindForSheet(sheetName: string, rows: unknown[][]): { kind?: UploadKind; headerRowIndex: number } {
  const lower = sheetName.toLowerCase();

  for (const fp of KIND_FINGERPRINTS) {
    const nameMatch = fp.sheetNames.some((n) => lower.includes(n));
    const headerIdx = findHeaderRow(rows, fp.required);
    if (nameMatch && headerIdx >= 0) return { kind: fp.kind, headerRowIndex: headerIdx };
    if (headerIdx >= 0 && !nameMatch) {
      // Soft match if headers match but sheet name doesn't
      return { kind: fp.kind, headerRowIndex: headerIdx };
    }
  }
  return { headerRowIndex: -1 };
}

function parseRowByKind(
  kind: UploadKind,
  row: unknown[],
  cols: Record<string, number>,
  rowIdx: number,
): ParsedRow | null {
  switch (kind) {
    case "PAYROLL":
      return parsePayrollRow(row, cols, rowIdx);
    case "ATTENDANCE":
      return parseAttendanceRow(row, cols, rowIdx);
    case "SHIFT":
      return parseShiftRow(row, cols, rowIdx);
    case "HOSTEL":
      return parseHostelRow(row, cols, rowIdx);
    case "INVOICES":
      return parseInvoiceRow(row, cols, rowIdx);
    case "PROCUREMENT":
      return parseProcurementRow(row, cols, rowIdx);
  }
}

function get(row: unknown[], col: number | undefined): unknown {
  if (col === undefined) return null;
  return row[col] ?? null;
}

// --- Per-kind row parsers --------------------------------------------------

function parsePayrollRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const empCol = pickColumn(cols, ["Employee No", "Employee No.", "EmpID", "Employee ID"]);
  const emp = get(row, empCol);
  if (!emp || typeof emp === "number" && !Number.isFinite(emp)) return null;

  const warnings: ParseWarning[] = [];

  const basic = parseInrPaise(get(row, pickColumn(cols, ["BASIC", "basic"])));
  const hra = parseInrPaise(get(row, pickColumn(cols, ["HRA"])));
  const conveyance = parseInrPaise(get(row, pickColumn(cols, ["CONVEYANCE ALLOWANCE", "Conveyance"])));
  const otherAllow = parseInrPaise(get(row, pickColumn(cols, ["OTHER ALLOWANCE", "Other Allowance"])));
  const otherEarn = parseInrPaise(get(row, pickColumn(cols, ["OTHER EARNINGS", "Other Earnings"])));
  const shiftAllow = parseInrPaise(get(row, pickColumn(cols, ["SHIFT ALLOWANCE", "Shift Allowance"])));
  const bonus = parseInrPaise(get(row, pickColumn(cols, ["BONUS"])));
  const gross = parseInrPaise(get(row, pickColumn(cols, ["GROSS"])));

  const pf = parseInrPaise(get(row, pickColumn(cols, ["Provident Fund", "PF"])));
  const pt = parseInrPaise(get(row, pickColumn(cols, ["PROF TAX", "Professional Tax", "PT"])));
  const incomeTax = parseInrPaise(get(row, pickColumn(cols, ["INCOME TAX", "TDS"])));
  const loan = parseInrPaise(get(row, pickColumn(cols, ["LOAN DEDUCTION", "Loan"])));
  const guesthouse = parseInrPaise(get(row, pickColumn(cols, ["GUEST HOUSE/OTHER DEDUCTION", "Guest House", "Hostel"])));
  const insurance = parseInrPaise(get(row, pickColumn(cols, ["INSURANCE DEDUCTION", "Insurance"])));
  const recovery = parseInrPaise(get(row, pickColumn(cols, ["RECOVERY"])));
  const totalDed = parseInrPaise(get(row, pickColumn(cols, ["TOTAL DEDUCTIONS", "Total Deductions"])));

  const netPay = parseInrPaise(get(row, pickColumn(cols, ["NET PAY", "Net Pay"])));
  // Note: REIMBURSTMENT (sic) is the column on real sheets
  const reimbursement = parseInrPaise(get(row, pickColumn(cols, ["REIMBURSTMENT", "REIMBURSEMENT", "Reimbursement"])));
  const totalPay = parseInrPaise(get(row, pickColumn(cols, ["Total  Pay", "Total Pay"])));

  // Soft validations
  if (basic !== null && hra !== null && conveyance !== null && gross !== null) {
    const expectedGrossMin = basic + hra + conveyance;
    if (gross < expectedGrossMin) {
      warnings.push({
        sheet: "PAYROLL",
        row: rowIdx + 1,
        column: "GROSS",
        level: "WARN",
        message: `GROSS ₹${Number(gross) / 100} < BASIC+HRA+CONVEYANCE ₹${Number(expectedGrossMin) / 100}`,
      });
    }
  }
  if (netPay !== null && gross !== null && totalDed !== null) {
    const expectedNet = gross - totalDed;
    if (netPay !== expectedNet) {
      warnings.push({
        sheet: "PAYROLL",
        row: rowIdx + 1,
        column: "NET PAY",
        level: "WARN",
        message: `NET ≠ GROSS − TOTAL DEDUCTIONS (off by ₹${Number(netPay - expectedNet) / 100})`,
      });
    }
  }
  if (pf === 0n && basic !== null && basic > 1500000n) {
    warnings.push({
      sheet: "PAYROLL",
      row: rowIdx + 1,
      column: "Provident Fund",
      level: "WARN",
      message: `PF is ₹0 on a BASIC of ₹${Number(basic) / 100} — likely missing`,
    });
  }

  return {
    rowIndex: rowIdx + 1,
    fields: {
      empNo: String(emp),
      name: String(get(row, pickColumn(cols, ["Name"])) ?? ""),
      designation: String(get(row, pickColumn(cols, ["Designation"])) ?? ""),
      basic: basicToNumber(basic),
      hra: basicToNumber(hra),
      conveyance: basicToNumber(conveyance),
      otherAllow: basicToNumber(otherAllow),
      otherEarn: basicToNumber(otherEarn),
      shiftAllow: basicToNumber(shiftAllow),
      bonus: basicToNumber(bonus),
      gross: basicToNumber(gross),
      pf: basicToNumber(pf),
      pt: basicToNumber(pt),
      incomeTax: basicToNumber(incomeTax),
      loan: basicToNumber(loan),
      guesthouse: basicToNumber(guesthouse),
      insurance: basicToNumber(insurance),
      recovery: basicToNumber(recovery),
      totalDed: basicToNumber(totalDed),
      netPay: basicToNumber(netPay),
      reimbursement: basicToNumber(reimbursement),
      totalPay: basicToNumber(totalPay),
    },
    warnings,
  };
}

function parseAttendanceRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const empCol = pickColumn(cols, ["Employee No", "Employee No.", "EmpID", "Employee ID"]);
  const emp = get(row, empCol);
  if (!emp) return null;

  const warnings: ParseWarning[] = [];
  const totalDays = Number(get(row, pickColumn(cols, ["TOTAL DAYS IN THE MONTH", "Total Days"])) ?? 0);
  const leaves = Number(get(row, pickColumn(cols, ["Total Leaves Taken", "Leaves"])) ?? 0);
  const lwp = Number(get(row, pickColumn(cols, ["LWP", "Leave Without Pay"])) ?? 0);
  const presentDays = Number(get(row, pickColumn(cols, ["PRESENT DAYS", "Present"])) ?? 0);
  const doj = parseDate(get(row, pickColumn(cols, ["DOJ", "DOJ - for New Joinees in this month"])));
  const lwd = parseDate(get(row, pickColumn(cols, ["LWD", "LWD - for Exit in this month"])));
  const isTest = parseBool(get(row, pickColumn(cols, ["Testing"]))) ?? false;

  if (totalDays > 0 && presentDays + leaves + lwp > totalDays) {
    warnings.push({
      sheet: "ATTENDANCE",
      row: rowIdx + 1,
      level: "WARN",
      message: `PRESENT + leaves + LWP (${presentDays + leaves + lwp}) > TOTAL DAYS (${totalDays})`,
    });
  }
  if (lwd && presentDays === totalDays) {
    warnings.push({
      sheet: "ATTENDANCE",
      row: rowIdx + 1,
      level: "WARN",
      message: `LWD set but PRESENT DAYS = full month — exit not pro-rated?`,
    });
  }

  return {
    rowIndex: rowIdx + 1,
    fields: {
      empNo: String(emp),
      name: String(get(row, pickColumn(cols, ["Name"])) ?? ""),
      totalDays,
      leaves,
      lwp,
      presentDays,
      doj: doj?.toISOString().slice(0, 10) ?? null,
      lwd: lwd?.toISOString().slice(0, 10) ?? null,
      isTest,
    },
    warnings,
  };
}

function parseShiftRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const empCol = pickColumn(cols, ["Employee No", "Employee No.", "EmpID", "Employee ID"]);
  const emp = get(row, empCol);
  if (!emp) return null;

  return {
    rowIndex: rowIdx + 1,
    fields: {
      empNo: String(emp),
      name: String(get(row, pickColumn(cols, ["Name"])) ?? ""),
      nightHome: Number(get(row, pickColumn(cols, ["No of Days for Night Shift- From home", "Night Home"])) ?? 0),
      phoneSupport: Number(get(row, pickColumn(cols, ["No of Days for Phone Support", "Phone Support"])) ?? 0),
      nightOffice: Number(get(row, pickColumn(cols, ["No of Days for Night Shift - From Office", "Night Office"])) ?? 0),
      weekend: Number(get(row, pickColumn(cols, ["No of Days for Weekend Shift", "Weekend"])) ?? 0),
      isTest: parseBool(get(row, pickColumn(cols, ["Testing"]))) ?? false,
    },
    warnings: [],
  };
}

function parseHostelRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const empCol = pickColumn(cols, ["Employee Code", "Employee No", "EmpID"]);
  const emp = get(row, empCol);
  if (!emp) return null;

  const warnings: ParseWarning[] = [];
  const accom = parseInrPaise(get(row, pickColumn(cols, ["Accomodation", "Accommodation"])));
  const maint = parseInrPaise(get(row, pickColumn(cols, ["Maintenance"])));
  const food = parseInrPaise(get(row, pickColumn(cols, ["Food"])));
  const transport = parseInrPaise(get(row, pickColumn(cols, ["Transport"])));
  const electricity = parseInrPaise(get(row, pickColumn(cols, ["Electricity"])));
  const internet = parseInrPaise(get(row, pickColumn(cols, ["Internet"])));
  const total = parseInrPaise(get(row, pickColumn(cols, ["TOTAL"])));

  if (accom !== null && maint !== null && food !== null && transport !== null && electricity !== null && internet !== null && total !== null) {
    const sum = accom + maint + food + transport + electricity + internet;
    if (sum !== total) {
      warnings.push({
        sheet: "HOSTEL",
        row: rowIdx + 1,
        column: "TOTAL",
        level: "WARN",
        message: `TOTAL ₹${Number(total) / 100} ≠ sum of items ₹${Number(sum) / 100}`,
      });
    }
  }

  return {
    rowIndex: rowIdx + 1,
    fields: {
      empCode: String(emp),
      name: String(get(row, pickColumn(cols, ["Name of employee", "Name"])) ?? ""),
      guestHouse: String(get(row, pickColumn(cols, ["Guest house", "Guest House"])) ?? ""),
      flatNo: String(get(row, pickColumn(cols, ["Flat no", "Flat No"])) ?? ""),
      accommodation: basicToNumber(accom),
      maintenance: basicToNumber(maint),
      food: basicToNumber(food),
      transport: basicToNumber(transport),
      electricity: basicToNumber(electricity),
      internet: basicToNumber(internet),
      total: basicToNumber(total),
    },
    warnings,
  };
}

function parseInvoiceRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const inv = get(row, pickColumn(cols, ["Invoice_Number", "Invoice Number"]));
  if (!inv) return null;
  return {
    rowIndex: rowIdx + 1,
    fields: {
      invoiceNumber: String(inv),
      vendorCode: String(get(row, pickColumn(cols, ["VendorCode", "Vendor Code"])) ?? ""),
      issuedOn: parseDate(get(row, pickColumn(cols, ["IssuedOn", "Issued On"])))?.toISOString().slice(0, 10) ?? null,
      subtotal: basicToNumber(parseInrPaise(get(row, pickColumn(cols, ["Subtotal_INR", "Subtotal"])))),
      tax: basicToNumber(parseInrPaise(get(row, pickColumn(cols, ["Tax_INR", "Tax"])))),
      total: basicToNumber(parseInrPaise(get(row, pickColumn(cols, ["Total_INR", "Total"])))),
    },
    warnings: [],
  };
}

function parseProcurementRow(row: unknown[], cols: Record<string, number>, rowIdx: number): ParsedRow | null {
  const cat = get(row, pickColumn(cols, ["Category_Name", "Category"]));
  if (!cat) return null;
  return {
    rowIndex: rowIdx + 1,
    fields: {
      category: String(cat),
      vendorCode: String(get(row, pickColumn(cols, ["VendorCode"])) ?? ""),
      occurredOn: parseDate(get(row, pickColumn(cols, ["OccurredOn"])))?.toISOString().slice(0, 10) ?? null,
      description: String(get(row, pickColumn(cols, ["Description"])) ?? ""),
      qty: parseQty(get(row, pickColumn(cols, ["Quantity"]))) ?? 0,
      unitPrice: basicToNumber(parseInrPaise(get(row, pickColumn(cols, ["Unit_Price_INR", "Unit Price"])))),
      total: basicToNumber(parseInrPaise(get(row, pickColumn(cols, ["Total_INR", "Total"])))),
    },
    warnings: [],
  };
}

function basicToNumber(b: bigint | null): number | null {
  if (b === null) return null;
  return Number(b);
}
