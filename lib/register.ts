import { prisma } from "@/lib/db";

export interface RegisterGate {
  cycleId: string;
  cycleLabel: string;
  cycleState: "OPEN" | "LOCKED" | "CLOSED";
  employeeCount: number;
  totalGrossPaise: bigint;
  totalDeductionsPaise: bigint;
  totalNetPayPaise: bigint;
  totalReimbursementPaise: bigint;
  totalPayoutPaise: bigint; // = net + reimbursement
  openAnomalies: number;
  acknowledgedAnomalies: number;
  dismissedAnomalies: number;
  canLock: boolean;
  lockedAt: Date | null;
}

export async function getRegisterGate(label: string): Promise<RegisterGate | null> {
  const cycle = await prisma.cycle.findUnique({ where: { label } });
  if (!cycle) return null;

  const [aggResult, employeeCount, anomalyBreakdown] = await Promise.all([
    prisma.payrollLine.aggregate({
      where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
      _sum: {
        grossPaise: true,
        totalDeductionsPaise: true,
        netPayPaise: true,
        reimbursementPaise: true,
      },
    }),
    prisma.payrollLine.count({
      where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
    }),
    prisma.anomaly.groupBy({
      by: ["status"],
      where: { cycleId: cycle.id },
      _count: true,
    }),
  ]);

  const open = anomalyBreakdown.find((a) => a.status === "OPEN")?._count ?? 0;
  const acked = anomalyBreakdown.find((a) => a.status === "ACKNOWLEDGED")?._count ?? 0;
  const dismissed = anomalyBreakdown.find((a) => a.status === "DISMISSED")?._count ?? 0;

  const netPay = aggResult._sum.netPayPaise ?? 0n;
  const reimb = aggResult._sum.reimbursementPaise ?? 0n;

  return {
    cycleId: cycle.id,
    cycleLabel: cycle.label,
    cycleState: cycle.state,
    employeeCount,
    totalGrossPaise: aggResult._sum.grossPaise ?? 0n,
    totalDeductionsPaise: aggResult._sum.totalDeductionsPaise ?? 0n,
    totalNetPayPaise: netPay,
    totalReimbursementPaise: reimb,
    totalPayoutPaise: netPay + reimb,
    openAnomalies: open,
    acknowledgedAnomalies: acked,
    dismissedAnomalies: dismissed,
    canLock: cycle.state === "OPEN",
    lockedAt: cycle.lockedAt,
  };
}

const REGISTER_HEADERS = [
  "Employee No",
  "Name",
  "Designation",
  "Department",
  "Pay Period",
  "Days Payable",
  "Present Days",
  "BASIC",
  "HRA",
  "CONVEYANCE ALLOWANCE",
  "OTHER ALLOWANCE",
  "OTHER EARNINGS",
  "SHIFT ALLOWANCE",
  "BONUS",
  "GROSS",
  "Provident Fund",
  "PROF TAX",
  "INCOME TAX",
  "LOAN DEDUCTION",
  "GUEST HOUSE/OTHER DEDUCTION",
  "INSURANCE DEDUCTION",
  "RECOVERY",
  "TOTAL DEDUCTIONS",
  "NET PAY",
  "REIMBURSTMENT",
  "Total Pay",
  "DEPOSIT",
];

function escapeCsv(v: string): string {
  if (v === null || v === undefined) return "";
  const needs = /[",\n\r]/.test(v);
  return needs ? `"${v.replace(/"/g, '""')}"` : v;
}

function paiseToInr(p: bigint): string {
  // Zoho Payroll wants plain INR amounts, no currency symbol, no commas
  return (Number(p) / 100).toFixed(2);
}

export async function buildRegisterCsv(label: string): Promise<{ filename: string; csv: string } | null> {
  const cycle = await prisma.cycle.findUnique({ where: { label } });
  if (!cycle) return null;

  const lines = await prisma.payrollLine.findMany({
    where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
    include: {
      employee: { select: { name: true, designation: true, department: true } },
    },
    orderBy: { empId: "asc" },
  });

  const rows: string[] = [REGISTER_HEADERS.map(escapeCsv).join(",")];
  for (const l of lines) {
    rows.push(
      [
        l.empId,
        l.employee.name,
        l.employee.designation,
        l.employee.department,
        label,
        l.totalDaysInMonth.toString(),
        l.presentDays.toString(),
        paiseToInr(l.basicPaise),
        paiseToInr(l.hraPaise),
        paiseToInr(l.conveyanceAllowPaise),
        paiseToInr(l.otherAllowPaise),
        paiseToInr(l.otherEarningsPaise),
        paiseToInr(l.shiftAllowPaise),
        paiseToInr(l.bonusPaise),
        paiseToInr(l.grossPaise),
        paiseToInr(l.pfPaise),
        paiseToInr(l.ptPaise),
        paiseToInr(l.incomeTaxPaise),
        paiseToInr(l.loanDeductionPaise),
        paiseToInr(l.guesthouseDedPaise),
        paiseToInr(l.insuranceDedPaise),
        paiseToInr(l.recoveryPaise),
        paiseToInr(l.totalDeductionsPaise),
        paiseToInr(l.netPayPaise),
        paiseToInr(l.reimbursementPaise),
        paiseToInr(l.totalPayPaise),
        l.depositStatus,
      ].map(escapeCsv).join(","),
    );
  }

  return {
    filename: `chanakya-register-${label}.csv`,
    csv: rows.join("\n") + "\n",
  };
}
