import type { PrismaClient } from "@prisma/client";
import type { CycleRef } from "./payroll";

/**
 * Plants the 21 demo anomalies into the seeded data.
 *
 * Each entry pairs a data-shaping side effect (mutating PayrollLines,
 * Invoices, or ProcurementEntries to introduce the fingerprint) with an
 * Anomaly row that the detector will surface and the scripted engine will
 * explain.
 *
 * Anchored against the active cycle (2026-04) so the demo shows them all
 * "in the current cycle".
 */

export async function plantAnomalies(prisma: PrismaClient, cycles: CycleRef[]) {
  const activeCycle = cycles.find((c) => c.label === "2026-04");
  if (!activeCycle) {
    throw new Error("Active cycle 2026-04 not found");
  }
  const cycleId = activeCycle.id;
  const aprIso = "2026-04";

  let planted = 0;

  // ---------- Payroll: #1 EMP-0142 duplicate net run (CRITICAL) ----------
  const aarav = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0142", run: { cycleId } },
  });
  if (aarav) {
    // Create a CORRECTION run with a second line for the same employee
    const corr = await prisma.payrollRun.create({
      data: {
        cycleId,
        runType: "CORRECTION",
        runDate: new Date("2026-04-28"),
        locked: false,
      },
    });
    await prisma.payrollLine.create({
      data: {
        runId: corr.id,
        empId: "EMP-0142",
        totalDaysInMonth: aarav.totalDaysInMonth,
        presentDays: aarav.presentDays,
        basicPaise: aarav.basicPaise,
        hraPaise: aarav.hraPaise,
        conveyanceAllowPaise: aarav.conveyanceAllowPaise,
        otherAllowPaise: aarav.otherAllowPaise,
        otherEarningsPaise: aarav.otherEarningsPaise,
        shiftAllowPaise: aarav.shiftAllowPaise,
        bonusPaise: aarav.bonusPaise,
        grossPaise: aarav.grossPaise,
        pfPaise: aarav.pfPaise,
        ptPaise: aarav.ptPaise,
        incomeTaxPaise: aarav.incomeTaxPaise,
        loanDeductionPaise: aarav.loanDeductionPaise,
        guesthouseDedPaise: aarav.guesthouseDedPaise,
        insuranceDedPaise: aarav.insuranceDedPaise,
        recoveryPaise: aarav.recoveryPaise,
        totalDeductionsPaise: aarav.totalDeductionsPaise,
        netPayPaise: aarav.netPayPaise,
        reimbursementPaise: 0n,
        totalPayPaise: aarav.netPayPaise,
        depositStatus: "PENDING",
      },
    });
    await prisma.anomaly.create({
      data: {
        kind: "SALARY_DUPLICATE_PAY",
        severity: "CRITICAL",
        confidence: 5,
        title: "EMP-0142 net pay 2× the trailing-12 median",
        summary: "Duplicate CORRECTION run reprocessed without offsetting",
        narrative:
          "EMP-0142 (Aarav Mehta) shows ₹2,04,800 net in Apr 2026 — exactly 2× the 12-month median of ₹1,02,400. A CORRECTION run on 2026-04-28 reprocessed the same line as the REGULAR run on 2026-04-25 without offsetting.",
        scriptedResponseKey: "pay.duplicate-net-run",
        payrollLineId: aarav.id,
        employeeEmpId: "EMP-0142",
        cycleId,
        raisedAt: new Date("2026-04-28T11:42:00"),
      },
    });
    planted++;
  }

  // ---------- Payroll: #2 EMP-0317 unjustified salary spike (HIGH) ----------
  const diya = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0317", run: { cycleId } },
  });
  if (diya) {
    const spike = 2_15_000n * 100n;
    const newSpecial = spike - diya.basicPaise - diya.hraPaise - diya.conveyanceAllowPaise;
    const newGross = diya.basicPaise + diya.hraPaise + diya.conveyanceAllowPaise + newSpecial;
    const newNet = newGross - diya.totalDeductionsPaise;
    await prisma.payrollLine.update({
      where: { id: diya.id },
      data: {
        otherAllowPaise: newSpecial > 0n ? newSpecial : diya.otherAllowPaise,
        grossPaise: newGross,
        netPayPaise: newNet,
        totalPayPaise: newNet + diya.reimbursementPaise,
      },
    });
    await prisma.anomaly.create({
      data: {
        kind: "SALARY_SPIKE",
        severity: "HIGH",
        confidence: 4,
        title: "EMP-0317 net spike +174% vs trailing-12 median",
        summary: "OTHER ALLOWANCE inflated without revision letter",
        narrative:
          "EMP-0317 (Diya Iyer) net spiked 174% vs trailing-12 median. The increment lives in OTHER ALLOWANCE, not BONUS, and no revision letter is on file.",
        scriptedResponseKey: "pay.spike-unjustified",
        payrollLineId: diya.id,
        employeeEmpId: "EMP-0317",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Payroll: #3 EMP-0205 missing PF (HIGH) ----------
  const rohan = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0205", run: { cycleId } },
  });
  if (rohan) {
    const newTotalDed = rohan.totalDeductionsPaise - rohan.pfPaise;
    const newNet = rohan.grossPaise - newTotalDed;
    await prisma.payrollLine.update({
      where: { id: rohan.id },
      data: {
        pfPaise: 0n,
        totalDeductionsPaise: newTotalDed,
        netPayPaise: newNet,
        totalPayPaise: newNet + rohan.reimbursementPaise,
      },
    });
    await prisma.anomaly.create({
      data: {
        kind: "STATUTORY_PF_MISSING",
        severity: "HIGH",
        confidence: 5,
        title: "EMP-0205 missing ₹8,160 PF deduction",
        summary: "Provident Fund column is ₹0 on a ₹68,000 BASIC",
        narrative:
          "EMP-0205 (Rohan Pillai) has ₹0 PF deduction on a ₹68,000 basic. Expected ₹8,160 at 12% statutory.",
        scriptedResponseKey: "pay.statutory-pf-missing",
        payrollLineId: rohan.id,
        employeeEmpId: "EMP-0205",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Payroll: #4 EMP-0481 new joiner not pro-rated (MEDIUM) ----------
  const shreya = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0481", run: { cycleId } },
  });
  if (shreya) {
    // Leave PayrollLine as full-month paid (already is). Anomaly flags that.
    await prisma.anomaly.create({
      data: {
        kind: "NEW_HIRE_NO_PRORATION",
        severity: "MEDIUM",
        confidence: 5,
        title: "EMP-0481 paid full month despite DOJ 2026-04-19",
        summary: "Attendance DOJ set but salary sheet pays 30/30",
        narrative:
          "EMP-0481 (Shreya Banerjee) DOJ is 2026-04-19 yet present days = 30/30 and full salary is paid. Pro-rated expectation: 12 days.",
        scriptedResponseKey: "pay.new-hire-no-proration",
        payrollLineId: shreya.id,
        employeeEmpId: "EMP-0481",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Attendance: LWP not reflected (HIGH) — EMP-0226 ----------
  const priya = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0226", run: { cycleId } },
  });
  if (priya) {
    await prisma.attendance.update({
      where: { cycleId_empId: { cycleId, empId: "EMP-0226" } },
      data: { lwpDays: 4, totalLeavesTaken: 0 },
    });
    await prisma.anomaly.create({
      data: {
        kind: "LWP_NOT_REFLECTED",
        severity: "HIGH",
        confidence: 5,
        title: "EMP-0226 attendance has 4 LWP but salary shows 30/30",
        summary: "Attendance LWP not honoured in PRESENT DAYS",
        narrative:
          "EMP-0226 (Priyanka Joshi) attendance sheet has 4 LWP days in Apr 2026 but salary's PRESENT DAYS reads 30/30. ₹11,467 over-payment.",
        scriptedResponseKey: "att.lwp-not-reflected",
        payrollLineId: priya.id,
        employeeEmpId: "EMP-0226",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Attendance: Exit paid full month (HIGH) — EMP-0117 ----------
  const anand = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0117", run: { cycleId } },
  });
  if (anand) {
    await prisma.attendance.update({
      where: { cycleId_empId: { cycleId, empId: "EMP-0117" } },
      data: { lwdThisMonth: new Date("2026-04-14") },
    });
    await prisma.anomaly.create({
      data: {
        kind: "EXIT_PAID_FULL_MONTH",
        severity: "HIGH",
        confidence: 5,
        title: "EMP-0117 LWD 2026-04-14 but paid full month",
        summary: "Final settlement not pro-rated through LWD",
        narrative:
          "EMP-0117 (Anand Krishnan) attendance has LWD = 2026-04-14 but salary pays a full 30/30 (GROSS ₹1,42,000). Pro-rated expectation through LWD: 14 days.",
        scriptedResponseKey: "att.exit-paid-full-month",
        payrollLineId: anand.id,
        employeeEmpId: "EMP-0117",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Shift: days entered but allowance zero (MEDIUM) — EMP-0408 ----------
  const meera = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0408", run: { cycleId } },
  });
  if (meera) {
    await prisma.shiftEntry.upsert({
      where: { cycleId_empId: { cycleId, empId: "EMP-0408" } },
      update: {
        nightOfficeDays: 6,
        weekendDays: 2,
        computedAllowPaise: 4_700n * 100n,
      },
      create: {
        cycleId,
        empId: "EMP-0408",
        nightHomeDays: 0,
        phoneSupportDays: 0,
        nightOfficeDays: 6,
        weekendDays: 2,
        computedAllowPaise: 4_700n * 100n,
        isTestRow: false,
      },
    });
    await prisma.payrollLine.update({
      where: { id: meera.id },
      data: { shiftAllowPaise: 0n },
    });
    await prisma.anomaly.create({
      data: {
        kind: "SHIFT_DAYS_NO_ALLOWANCE",
        severity: "MEDIUM",
        confidence: 4,
        title: "EMP-0408 has 6+2 shift days but ₹0 SHIFT ALLOWANCE",
        summary: "Shift entries not joined into payroll",
        narrative:
          "EMP-0408 (Meera Subramanian) shift sheet records 6 Night Shift From Office days and 2 Weekend Shift days in Apr 2026, but SHIFT ALLOWANCE reads ₹0. Expected ₹4,700.",
        scriptedResponseKey: "shift.days-no-allowance",
        payrollLineId: meera.id,
        employeeEmpId: "EMP-0408",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Hostel: TOTAL ≠ sum (HIGH) — EMP-0349 ----------
  const hostel349 = await prisma.hostelAllocation.findUnique({
    where: { cycleId_empId: { cycleId, empId: "EMP-0349" } },
  });
  if (hostel349) {
    // Set deterministic line items so the demo math is clean
    await prisma.hostelAllocation.update({
      where: { cycleId_empId: { cycleId, empId: "EMP-0349" } },
      data: {
        guestHouse: "Pune GH-2",
        flatNo: "304",
        accommodationPaise: 6_000n * 100n,
        maintenancePaise: 500n * 100n,
        foodPaise: 4_200n * 100n,
        transportPaise: 0n,
        electricityPaise: 820n * 100n,
        internetPaise: 350n * 100n,
        totalPaise: 12_870n * 100n, // sum is actually 11,870 — TOTAL is hand-typed wrong
      },
    });
    await prisma.payrollLine.updateMany({
      where: { empId: "EMP-0349", run: { cycleId } },
      data: { guesthouseDedPaise: 14_000n * 100n }, // payroll also has its own wrong value
    });
    await prisma.anomaly.create({
      data: {
        kind: "HOSTEL_TOTAL_MISMATCH",
        severity: "HIGH",
        confidence: 5,
        title: "EMP-0349 hostel line items sum to ₹11,870, TOTAL says ₹12,870",
        summary: "Hand-typed TOTAL exceeds sum of items by ₹1,000",
        narrative:
          "Hostel sheet for EMP-0349 (Vikram Choudhary, Pune GH-2 / Flat 304) sums to ₹11,870 across the six items, but the TOTAL column reads ₹12,870 — likely a hand-typed override.",
        scriptedResponseKey: "hostel.total-mismatch",
        employeeEmpId: "EMP-0349",
        cycleId,
      },
    });
    planted++;
    await prisma.anomaly.create({
      data: {
        kind: "HOSTEL_PAYROLL_MISMATCH",
        severity: "HIGH",
        confidence: 5,
        title: "Hostel rolls up to ₹11,870, salary GUEST HOUSE deducts ₹14,000",
        summary: "₹2,130 over-deduction on EMP-0349",
        narrative:
          "Hostel sheet rolls up to ₹11,870 for EMP-0349 but salary sheet's GUEST HOUSE/OTHER DEDUCTION is ₹14,000 — a ₹2,130 over-deduction.",
        scriptedResponseKey: "hostel.payroll-mismatch",
        employeeEmpId: "EMP-0349",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Payroll: Net formula broken (HIGH) — EMP-0091 ----------
  const karthik = await prisma.payrollLine.findFirst({
    where: { empId: "EMP-0091", run: { cycleId } },
  });
  if (karthik) {
    // Hand-tweak NET so net ≠ gross − total_ded
    const newNet = karthik.grossPaise - karthik.totalDeductionsPaise - 2_000n * 100n;
    await prisma.payrollLine.update({
      where: { id: karthik.id },
      data: { netPayPaise: newNet, totalPayPaise: newNet + karthik.reimbursementPaise },
    });
    await prisma.anomaly.create({
      data: {
        kind: "NET_FORMULA_BROKEN",
        severity: "HIGH",
        confidence: 5,
        title: "EMP-0091 NET PAY ₹2,000 short of (GROSS − TOTAL DEDUCTIONS)",
        summary: "Salary sheet's NET column was overridden",
        narrative:
          "EMP-0091 (Karthik Nair) salary sheet shows GROSS ₹1,18,400, TOTAL DEDUCTIONS ₹14,820, NET PAY ₹1,01,580 — ₹2,000 short of the formula.",
        scriptedResponseKey: "pay.net-formula-broken",
        payrollLineId: karthik.id,
        employeeEmpId: "EMP-0091",
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Vendor invoice anomalies — narrative-only rows so they show in the inbox ----------
  // We don't deeply mutate invoice data here; the scripted detector will surface these
  // from invoice data once vendors.ts seeds the matching invoices. For demo completeness
  // we register the Anomaly rows referencing the right vendor by code.

  const findVendor = (code: string) => prisma.vendor.findUnique({ where: { code } });
  const ven = {
    bharat:    await findVendor("VEN-022"),
    northstar: await findVendor("VEN-008"),
    datadrive: await findVendor("VEN-014"),
    kaveri:    await findVendor("VEN-031"),
    sahyadri:  await findVendor("VEN-007"),
    madhuri:   await findVendor("VEN-019"),
    annapurna: await findVendor("VEN-026"),
    tasty:     await findVendor("VEN-040"),
  };

  const vendorAnomalies: Array<{
    key: string;
    kind: "INVOICE_MISSING_LINES" | "INVOICE_DUPLICATE" | "INVOICE_PRICE_DRIFT" | "INVOICE_DEDUCTION_MISMATCH" | "INVOICE_TAX_INCONSISTENT" | "INVOICE_GST_INVALID";
    severity: "HIGH" | "MEDIUM";
    confidence: 1 | 2 | 3 | 4 | 5;
    title: string;
    summary: string;
    narrative: string;
    vendor?: { id: string } | null;
  }> = [
    {
      key: "inv.missing-lines",
      kind: "INVOICE_MISSING_LINES",
      severity: "HIGH",
      confidence: 5,
      title: "Bharat Logistics — invoice header ₹4,82,000 vs lines ₹4,17,500",
      summary: "Missing line: Last-mile delivery — Pune, ₹64,500",
      narrative:
        "Invoice INV-2026-04-119 from Bharat Logistics totals ₹4,82,000 in the header but the line items sum to ₹4,17,500. The missing line — 'Last-mile delivery — Pune, ₹64,500' — exists on PO-2026-0419.",
      vendor: ven.bharat,
    },
    {
      key: "inv.duplicate",
      kind: "INVOICE_DUPLICATE",
      severity: "HIGH",
      confidence: 5,
      title: "NorthStar — two invoices ₹1,84,250 within 36 hours",
      summary: "100% line match between NS/2026/0411 and NS/2026/0411-A",
      narrative:
        "NorthStar Office Supplies submitted two invoices with identical line items totalling ₹1,84,250 within 36 hours. Likely a duplicate submission.",
      vendor: ven.northstar,
    },
    {
      key: "inv.price-drift",
      kind: "INVOICE_PRICE_DRIFT",
      severity: "HIGH",
      confidence: 4,
      title: "DataDrive — Dell Latitude 5440 unit price drift +17–19%",
      summary: "₹78,200 → ₹91,500–₹93,200 with no PO amendment",
      narrative:
        "DataDrive Hardware's unit price for the Dell Latitude 5440 rose from a 6-month median of ₹78,200 to ₹91,500–₹93,200 (+17–19%) on the last two invoices.",
      vendor: ven.datadrive,
    },
    {
      key: "inv.deduction-mismatch",
      kind: "INVOICE_DEDUCTION_MISMATCH",
      severity: "MEDIUM",
      confidence: 4,
      title: "Kaveri Travel House — invoice TDS 2% vs contract 1%",
      summary: "₹40,000 vs ₹20,000 ledger reflection",
      narrative:
        "Kaveri Travel House's invoice INV-KTH-04-31 shows TDS deducted at 2% (₹40,000). Contract terms specify 1% (₹20,000). Ledger posted ₹20,000.",
      vendor: ven.kaveri,
    },
    {
      key: "inv.tax-inconsistent",
      kind: "INVOICE_TAX_INCONSISTENT",
      severity: "MEDIUM",
      confidence: 5,
      title: "Sahyadri — mixed 18%/12% GST on identical SaaS SKU",
      summary: "12% is not valid for this SAC code",
      narrative:
        "Invoice INV-ST-2026-77 mixes 18% and 12% GST on five lines that are all the same SaaS subscription SKU.",
      vendor: ven.sahyadri,
    },
    {
      key: "inv.gst-invalid",
      kind: "INVOICE_GST_INVALID",
      severity: "MEDIUM",
      confidence: 5,
      title: "Madhuri Catering — GSTIN checksum fails",
      summary: "27AAACM1234X1ZZ is not a valid GSTIN",
      narrative:
        "Vendor Madhuri Catering's GSTIN `27AAACM1234X1ZZ` fails the standard checksum.",
      vendor: ven.madhuri,
    },
  ];

  for (const va of vendorAnomalies) {
    if (!va.vendor) continue;
    await prisma.anomaly.create({
      data: {
        kind: va.kind,
        severity: va.severity,
        confidence: va.confidence,
        title: va.title,
        summary: va.summary,
        narrative: va.narrative,
        scriptedResponseKey: va.key,
        vendorId: va.vendor.id,
        cycleId,
      },
    });
    planted++;
  }

  // ---------- Spend anomalies — narrative rows attached to cycle ----------
  const spendAnomalies: Array<{
    key: string;
    kind: "SPEND_CATEGORY_VARIANCE" | "SPEND_UNIT_PRICE_DRIFT" | "SPEND_OFF_CONTRACT" | "SPEND_SPLIT_PURCHASE";
    severity: "HIGH" | "MEDIUM";
    confidence: 1 | 2 | 3 | 4 | 5;
    title: string;
    summary: string;
    narrative: string;
  }> = [
    {
      key: "spend.category-variance-laptops",
      kind: "SPEND_CATEGORY_VARIANCE",
      severity: "HIGH",
      confidence: 5,
      title: "Laptops category +131% vs 6-month average",
      summary: "₹14.80 L vs ₹6.40 L baseline",
      narrative:
        "Laptops category spend in April 2026 hit ₹14,80,000 — 131% above the trailing 6-month average of ₹6,40,000.",
    },
    {
      key: "spend.unit-price-drift-veg",
      kind: "SPEND_UNIT_PRICE_DRIFT",
      severity: "MEDIUM",
      confidence: 4,
      title: "Tomatoes ₹42→₹78/kg from Annapurna Mart",
      summary: "+86% on the week of 2026-04-22",
      narrative:
        "Tomatoes from Annapurna Mart jumped from a 12-week median of ₹42/kg to ₹78/kg in the week of 2026-04-22.",
    },
    {
      key: "spend.off-contract",
      kind: "SPEND_OFF_CONTRACT",
      severity: "MEDIUM",
      confidence: 5,
      title: "Off-contract catering — Tasty Bites Express ₹1,18,500",
      summary: "Vendor not on approved catering panel",
      narrative:
        "A ₹1,18,500 catering charge on 2026-04-12 was booked against Tasty Bites Express (VEN-040), which is not on the approved catering panel (VEN-019, VEN-033).",
    },
    {
      key: "spend.split-purchase",
      kind: "SPEND_SPLIT_PURCHASE",
      severity: "HIGH",
      confidence: 4,
      title: "Three POs ₹49,500–₹49,900 to NorthStar in 9 days",
      summary: "All just under ₹50,000 single-approver threshold",
      narrative:
        "Three POs to NorthStar Office Supplies in 9 days, each ₹49,500–₹49,900 — all just under the ₹50,000 single-approver threshold.",
    },
  ];

  for (const sa of spendAnomalies) {
    await prisma.anomaly.create({
      data: {
        kind: sa.kind,
        severity: sa.severity,
        confidence: sa.confidence,
        title: sa.title,
        summary: sa.summary,
        narrative: sa.narrative,
        scriptedResponseKey: sa.key,
        cycleId,
      },
    });
    planted++;
  }

  console.log(`  ✓ ${planted} anomalies planted in cycle ${aprIso}`);
}
