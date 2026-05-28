import type { PrismaClient } from "@prisma/client";
import { Rng } from "./rng";
import type { SeededEmployee } from "./people";

// Generates 18 monthly cycles (Nov 2024 → Apr 2026 inclusive), with a
// REGULAR PayrollRun + 486 PayrollLines per cycle, plus matching
// Attendance, ShiftEntry, and HostelAllocation rows for the relevant
// employees. Apr 2026 is left OPEN; older cycles are LOCKED.

const CYCLES: { label: string; year: number; month: number }[] = [];
{
  // 18 months ending Apr 2026
  const end = { year: 2026, month: 4 };
  for (let i = 17; i >= 0; i--) {
    let m = end.month - i;
    let y = end.year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    CYCLES.push({ label: `${y}-${String(m).padStart(2, "0")}`, year: y, month: m });
  }
}

export const ACTIVE_CYCLE = CYCLES[CYCLES.length - 1]!; // 2026-04

export interface CycleRef {
  id: string;
  label: string;
  periodStart: Date;
  periodEnd: Date;
  totalDays: number;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function pf(basic: bigint): bigint {
  // 12% statutory, capped at ₹1,800 (15,000 ceiling × 12%) for most employers.
  // We honour the cap to keep numbers realistic.
  const computed = (basic * 12n) / 100n;
  const cap = 1800n * 100n; // paise
  return computed > cap ? cap : computed;
}

function pt(grossPaise: bigint): bigint {
  // Karnataka PT slab simplified: ₹200/mo above ~₹15K gross.
  return grossPaise > 15_000n * 100n ? 20000n : 0n;
}

function tdsOn(annualGross: bigint): bigint {
  // Heuristic: 10% on amounts above ₹5L annual gross, distributed monthly.
  const slabAnnual = 5_00_000n * 100n;
  if (annualGross <= slabAnnual) return 0n;
  const taxable = annualGross - slabAnnual;
  const annual = taxable / 10n;
  return annual / 12n;
}

export async function seedCyclesAndPayroll(
  prisma: PrismaClient,
  employees: SeededEmployee[],
): Promise<CycleRef[]> {
  const rng = new Rng(0x5041_5950); // "PAYP"
  const cycleRefs: CycleRef[] = [];

  for (const c of CYCLES) {
    const days = daysInMonth(c.year, c.month);
    const periodStart = new Date(c.year, c.month - 1, 1);
    const periodEnd = new Date(c.year, c.month - 1, days);
    const isActive = c.label === ACTIVE_CYCLE.label;

    const cycle = await prisma.cycle.upsert({
      where: { label: c.label },
      update: {},
      create: {
        label: c.label,
        periodStart,
        periodEnd,
        totalDays: days,
        state: isActive ? "OPEN" : "LOCKED",
        lockedAt: isActive ? null : periodEnd,
      },
    });
    cycleRefs.push({ id: cycle.id, label: cycle.label, periodStart, periodEnd, totalDays: days });

    const run = await prisma.payrollRun.create({
      data: {
        cycleId: cycle.id,
        runType: "REGULAR",
        runDate: new Date(c.year, c.month - 1, 25),
        locked: !isActive,
      },
    });

    // Per-employee lines
    for (const e of employees) {
      // Skip employees who hadn't joined yet
      if (e.doj > periodEnd) continue;

      const basic = e.basicMonthlyPaise;
      const hra = (basic * 40n) / 100n;
      const conveyance = 1_600n * 100n;
      const otherAllow = (basic * 5n) / 100n;
      const otherEarn = 0n;
      const shiftAllow = e.department === "Support — Night Shift" ? BigInt(rng.intBetween(2500, 6500)) * 100n : 0n;
      const bonus = 0n;
      const gross = basic + hra + conveyance + otherAllow + otherEarn + shiftAllow + bonus;

      const pfDed = pf(basic);
      const ptDed = pt(gross);
      const tdsDed = tdsOn(gross * 12n);
      const insuranceDed = 1_200n * 100n;
      const guesthouseDed = 0n; // overridden in hostel.ts for allocated employees
      const totalDed = pfDed + ptDed + tdsDed + insuranceDed + guesthouseDed;

      const netPay = gross - totalDed;
      const reimbursement = rng.bool(0.06) ? BigInt(rng.intBetween(1000, 8000)) * 100n : 0n;
      const totalPay = netPay + reimbursement;

      await prisma.payrollLine.create({
        data: {
          runId: run.id,
          empId: e.empId,
          totalDaysInMonth: days,
          presentDays: days,
          basicPaise: basic,
          hraPaise: hra,
          conveyanceAllowPaise: conveyance,
          otherAllowPaise: otherAllow,
          otherEarningsPaise: otherEarn,
          shiftAllowPaise: shiftAllow,
          bonusPaise: bonus,
          grossPaise: gross,
          pfPaise: pfDed,
          esiPaise: 0n,
          ptPaise: ptDed,
          incomeTaxPaise: tdsDed,
          loanDeductionPaise: 0n,
          guesthouseDedPaise: guesthouseDed,
          insuranceDedPaise: insuranceDed,
          recoveryPaise: 0n,
          totalDeductionsPaise: totalDed,
          netPayPaise: netPay,
          reimbursementPaise: reimbursement,
          totalPayPaise: totalPay,
          depositStatus: isActive ? "PENDING" : "DEPOSITED",
        },
      });

      // Attendance — full attendance except the anomaly-target employees
      await prisma.attendance.upsert({
        where: { cycleId_empId: { cycleId: cycle.id, empId: e.empId } },
        update: {},
        create: {
          cycleId: cycle.id,
          empId: e.empId,
          totalDaysInMonth: days,
          totalLeavesTaken: 0,
          lwpDays: 0,
          presentDays: days,
          dojThisMonth: e.doj >= periodStart && e.doj <= periodEnd ? e.doj : null,
          isTestRow: false,
        },
      });

      // Shift entries for night-shift department
      if (e.department === "Support — Night Shift") {
        await prisma.shiftEntry.upsert({
          where: { cycleId_empId: { cycleId: cycle.id, empId: e.empId } },
          update: {},
          create: {
            cycleId: cycle.id,
            empId: e.empId,
            nightHomeDays: rng.intBetween(2, 8),
            phoneSupportDays: rng.intBetween(0, 4),
            nightOfficeDays: rng.intBetween(0, 6),
            weekendDays: rng.intBetween(0, 3),
            computedAllowPaise: shiftAllow,
            isTestRow: false,
          },
        });
      }
    }

    console.log(`  ✓ cycle ${c.label} — payroll + attendance${isActive ? " (OPEN)" : ""}`);
  }

  return cycleRefs;
}
