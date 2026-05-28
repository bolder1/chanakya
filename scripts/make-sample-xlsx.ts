/**
 * One-off generator for data/samples/payroll-input.messy.xlsx.
 * Run via:  pnpm tsx scripts/make-sample-xlsx.ts
 *
 * Intentionally messy:
 *   - 2 leading blank rows above the header
 *   - "Department" column merged label (we only see leftmost cell)
 *   - INR with ₹ and commas
 *   - REIMBURSTMENT typo (sic) — real MiniOrange column
 *   - One row where NET PAY ≠ GROSS − TOTAL DEDUCTIONS (triggers a warning)
 *   - One row with ₹0 PF on a high BASIC (triggers a warning)
 *   - A "Total" footer row to be skipped
 */

import * as XLSX from "xlsx";
import path from "node:path";
import { mkdirSync } from "node:fs";

const sheets: Record<string, unknown[][]> = {};

// ============================================================================
// SALARY SHEET
// ============================================================================
sheets["Payroll-2026-04"] = [
  [],
  ["Confidential — Internal — MiniOrange Payroll April 2026"],
  [
    "Sl No", "Employee No", "Name", "Designation", "CTC",
    "TOTAL DAYS IN THE MONTH", "PRESENT DAYS",
    "BASIC", "HRA", "CONVEYANCE ALLOWANCE", "OTHER ALLOWANCE", "OTHER EARNINGS",
    "SHIFT ALLOWANCE", "BONUS", "GROSS",
    "Provident Fund", "PROF TAX", "INCOME TAX", "LOAN DEDUCTION",
    "GUEST HOUSE/OTHER DEDUCTION", "INSURANCE DEDUCTION", "RECOVERY",
    "TOTAL DEDUCTIONS", "NET PAY", "REIMBURSTMENT", "Total  Pay", "DEPOSIT",
  ],
  // Clean row
  [
    1, "EMP-0142", "Aarav Mehta", "Sr. Engineer", "₹14,40,000",
    30, 30,
    "₹1,02,400", "₹40,960", "₹1,600", "₹5,120", 0,
    0, 0, "₹1,50,080",
    "₹1,800", "₹200", "₹6,250", 0,
    0, "₹1,200", 0,
    "₹9,450", "₹1,40,630", 0, "₹1,40,630", "PENDING",
  ],
  // EMP-0205 — PF intentionally zero on high basic (anomaly)
  [
    2, "EMP-0205", "Rohan Pillai", "Sr. DevOps Engineer", "₹12,60,000",
    30, 30,
    "₹68,000", "₹27,200", "₹1,600", "₹3,400", 0,
    0, 0, "₹1,00,200",
    "₹0", "₹200", "₹2,500", 0,
    0, "₹1,200", 0,
    "₹3,900", "₹96,300", 0, "₹96,300", "PENDING",
  ],
  // EMP-0317 — clean
  [
    3, "EMP-0317", "Diya Iyer", "Account Executive", "₹11,00,000",
    30, 30,
    "₹78,500", "₹31,400", "₹1,600", "₹3,925", 0,
    0, 0, "₹1,15,425",
    "₹1,800", "₹200", "₹4,800", 0,
    0, "₹1,200", 0,
    "₹8,000", "₹1,07,425", 0, "₹1,07,425", "PENDING",
  ],
  // EMP-0091 — NET PAY formula broken (anomaly)
  [
    4, "EMP-0091", "Karthik Nair", "Finance Analyst", "₹10,20,000",
    30, 30,
    "₹72,000", "₹28,800", "₹1,600", "₹3,600", 0,
    0, 0, "₹1,06,000",
    "₹1,800", "₹200", "₹3,400", 0,
    0, "₹1,200", 0,
    "₹6,600", "₹97,400", 0, "₹97,400", "PENDING",
    // <- NET PAY should be ₹99,400 (₹1,06,000 − ₹6,600); we wrote ₹97,400 (off by ₹2,000)
  ],
  // EMP-0481 — full month paid despite mid-month DOJ (will trigger another tool's anomaly)
  [
    5, "EMP-0481", "Shreya Banerjee", "CSM", "₹9,60,000",
    30, 30,
    "₹72,000", "₹28,800", "₹1,600", "₹3,600", 0,
    0, 0, "₹1,06,000",
    "₹1,800", "₹200", "₹2,500", 0,
    0, "₹1,200", 0,
    "₹5,700", "₹1,00,300", 0, "₹1,00,300", "PENDING",
  ],
  // EMP-0349 with hostel deduction
  [
    6, "EMP-0349", "Vikram Choudhary", "Software Engineer", "₹8,40,000",
    30, 30,
    "₹58,000", "₹23,200", "₹1,600", "₹2,900", 0,
    0, 0, "₹85,700",
    "₹1,800", "₹200", "₹1,800", 0,
    "₹14,000", "₹1,200", 0,
    "₹19,000", "₹66,700", 0, "₹66,700", "PENDING",
  ],
  // Footer row to be skipped
  ["Total", "", "", "", "", "", "", "", "", "", "", "", "", "", "₹7,33,405", "", "", "", "", "", "", "", "₹52,650", "₹6,40,755", 0, "₹6,40,755", ""],
];

// ============================================================================
// ATTENDANCE SHEET
// ============================================================================
sheets["attendance"] = [
  [],
  [
    "Employee ID", "Testing", "Sl No", "Employee No", "Name",
    "TOTAL DAYS IN THE MONTH", "Total Leaves Taken", "LWP", "PRESENT DAYS",
    "DOJ - for New Joinees in this month", "LWD - for Exit in this month",
  ],
  [20142, "FALSE", 1, "EMP-0142", "Aarav Mehta", 30, 0, 0, 30, "", ""],
  [20205, "FALSE", 2, "EMP-0205", "Rohan Pillai", 30, 0, 0, 30, "", ""],
  [20226, "FALSE", 3, "EMP-0226", "Priyanka Joshi", 30, 0, 4, 30, "", ""], // LWP not reflected in PRESENT DAYS
  [20481, "FALSE", 4, "EMP-0481", "Shreya Banerjee", 30, 0, 0, 30, "2026-04-19", ""], // joined mid-month but full attendance
  [20117, "FALSE", 5, "EMP-0117", "Anand Krishnan", 30, 0, 0, 30, "", "2026-04-14"], // exited mid-month but full month
  [99999, "TRUE", 99, "EMP-9999", "Testing Row", 30, 0, 0, 0, "", ""], // test row
];

// ============================================================================
// SHIFT SHEET
// ============================================================================
sheets["shift"] = [
  [],
  [
    "Employee ID", "Testing", "Sl No", "Employee No.", "Name",
    "No of Days for Night Shift- From home", "No of Days for Phone Support",
    "No of Days for Night Shift - From Office", "No of Days for Weekend Shift",
  ],
  [20408, "FALSE", 1, "EMP-0408", "Meera Subramanian", 0, 0, 6, 2],
  [20143, "FALSE", 2, "EMP-0143", "Sai Krishnan", 5, 3, 0, 1],
  [20144, "FALSE", 3, "EMP-0144", "Sneha Banerjee", 0, 0, 4, 0],
];

// ============================================================================
// HOSTEL SHEET — line items intentionally don't sum to TOTAL (anomaly)
// ============================================================================
sheets["hostel deduction"] = [
  [],
  [
    "Sr.No.", "Guest house", "Flat no", "Employee Code", "Name of employee",
    "Accomodation", "Maintenance", "Food", "Transport", "Electricity", "Internet", "TOTAL",
  ],
  [1, "Pune GH-2", "304", "EMP-0349", "Vikram Choudhary", 6000, 500, 4200, 0, 820, 350, 12870], // sum is 11,870; TOTAL is wrong
  [2, "Pune GH-1", "201", "EMP-0143", "Sai Krishnan", 5500, 500, 3800, 800, 700, 350, 11650],
  [3, "Bengaluru Saraswati", "405", "EMP-0144", "Sneha Banerjee", 7000, 800, 5000, 1200, 950, 450, 15400],
];

// ============================================================================
// Build workbook and write
// ============================================================================
const wb = XLSX.utils.book_new();
for (const [name, rows] of Object.entries(sheets)) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

const outDir = path.join(process.cwd(), "data", "samples");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "payroll-input.messy.xlsx");
XLSX.writeFile(wb, outPath);
console.log("✓ wrote", outPath);
