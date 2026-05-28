import { prisma } from "@/lib/db";
import type {
  AnomalyKind,
  AnomalySeverity,
  AnomalyStatus,
  Cycle,
} from "@prisma/client";

const PAYROLL_KINDS: AnomalyKind[] = [
  "SALARY_SPIKE",
  "SALARY_DUPLICATE_PAY",
  "STATUTORY_PF_MISSING",
  "STATUTORY_PT_MISMATCH",
  "NEW_HIRE_NO_PRORATION",
  "NET_FORMULA_BROKEN",
  "REIMBURSEMENT_OUTLIER",
  "ATTENDANCE_DAYS_MISMATCH",
  "LWP_NOT_REFLECTED",
  "EXIT_PAID_FULL_MONTH",
  "SHIFT_ALLOW_MISSING",
  "SHIFT_DAYS_NO_ALLOWANCE",
  "HOSTEL_TOTAL_MISMATCH",
  "HOSTEL_PAYROLL_MISMATCH",
];

export interface CycleSummary {
  id: string;
  label: string;
  state: Cycle["state"];
  periodStart: Date;
  periodEnd: Date;
  totalDays: number;
  payoutPaise: bigint;
  employeeCount: number;
  payrollAnomalyCount: number;
}

export async function listCyclesWithSummary(): Promise<CycleSummary[]> {
  const cycles = await prisma.cycle.findMany({
    orderBy: { periodStart: "desc" },
  });

  const summaries: CycleSummary[] = [];
  for (const c of cycles) {
    const [payoutAgg, lineCount, anomalyCount] = await Promise.all([
      prisma.payrollLine.aggregate({
        where: { run: { cycleId: c.id, runType: "REGULAR" } },
        _sum: { netPayPaise: true },
      }),
      prisma.payrollLine.count({
        where: { run: { cycleId: c.id, runType: "REGULAR" } },
      }),
      prisma.anomaly.count({
        where: { cycleId: c.id, status: "OPEN", kind: { in: PAYROLL_KINDS } },
      }),
    ]);
    summaries.push({
      id: c.id,
      label: c.label,
      state: c.state,
      periodStart: c.periodStart,
      periodEnd: c.periodEnd,
      totalDays: c.totalDays,
      payoutPaise: payoutAgg._sum.netPayPaise ?? 0n,
      employeeCount: lineCount,
      payrollAnomalyCount: anomalyCount,
    });
  }
  return summaries;
}

export async function getCycleByLabel(label: string) {
  return prisma.cycle.findUnique({ where: { label } });
}

export interface CycleDetail {
  cycle: Cycle;
  payoutPaise: bigint;
  grossPaise: bigint;
  totalDeductionsPaise: bigint;
  totalReimbursementsPaise: bigint;
  employeeCount: number;
  withLwpCount: number;
  newJoinerCount: number;
  exitCount: number;
  runs: Array<{
    id: string;
    runType: string;
    runDate: Date;
    lineCount: number;
    payoutPaise: bigint;
  }>;
  topAnomalies: Array<{
    id: string;
    kind: AnomalyKind;
    severity: AnomalySeverity;
    title: string;
    confidence: number;
  }>;
}

export async function getCycleDetail(label: string): Promise<CycleDetail | null> {
  const cycle = await prisma.cycle.findUnique({ where: { label } });
  if (!cycle) return null;

  const [payAgg, lineCount, lwpCount, joinerCount, exitCount, runs, anomalies] = await Promise.all([
    prisma.payrollLine.aggregate({
      where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
      _sum: {
        netPayPaise: true,
        grossPaise: true,
        totalDeductionsPaise: true,
        reimbursementPaise: true,
      },
    }),
    prisma.payrollLine.count({
      where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
    }),
    prisma.attendance.count({ where: { cycleId: cycle.id, lwpDays: { gt: 0 } } }),
    prisma.attendance.count({ where: { cycleId: cycle.id, dojThisMonth: { not: null } } }),
    prisma.attendance.count({ where: { cycleId: cycle.id, lwdThisMonth: { not: null } } }),
    prisma.payrollRun.findMany({
      where: { cycleId: cycle.id },
      orderBy: { runDate: "asc" },
      include: {
        lines: { select: { netPayPaise: true } },
      },
    }),
    prisma.anomaly.findMany({
      where: { cycleId: cycle.id, status: "OPEN", kind: { in: PAYROLL_KINDS } },
      orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
      take: 10,
    }),
  ]);

  return {
    cycle,
    payoutPaise: payAgg._sum.netPayPaise ?? 0n,
    grossPaise: payAgg._sum.grossPaise ?? 0n,
    totalDeductionsPaise: payAgg._sum.totalDeductionsPaise ?? 0n,
    totalReimbursementsPaise: payAgg._sum.reimbursementPaise ?? 0n,
    employeeCount: lineCount,
    withLwpCount: lwpCount,
    newJoinerCount: joinerCount,
    exitCount,
    runs: runs.map((r) => ({
      id: r.id,
      runType: r.runType,
      runDate: r.runDate,
      lineCount: r.lines.length,
      payoutPaise: r.lines.reduce((acc, l) => acc + l.netPayPaise, 0n),
    })),
    topAnomalies: anomalies.map((a) => ({
      id: a.id,
      kind: a.kind,
      severity: a.severity,
      title: a.title,
      confidence: a.confidence,
    })),
  };
}

export interface AnomalyRow {
  id: string;
  kind: AnomalyKind;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  confidence: number;
  title: string;
  summary: string;
  narrative: string;
  scriptedResponseKey: string | null;
  raisedAt: Date;
  employee: { empId: string; name: string } | null;
  vendor: { code: string; legalName: string } | null;
  cycle: { label: string } | null;
}

export async function listAnomalies(opts: {
  cycleLabel?: string;
  kinds?: AnomalyKind[];
  severity?: AnomalySeverity;
  status?: AnomalyStatus;
}): Promise<AnomalyRow[]> {
  const cycle = opts.cycleLabel
    ? await prisma.cycle.findUnique({ where: { label: opts.cycleLabel } })
    : null;

  const rows = await prisma.anomaly.findMany({
    where: {
      ...(cycle ? { cycleId: cycle.id } : {}),
      ...(opts.kinds ? { kind: { in: opts.kinds } } : {}),
      ...(opts.severity ? { severity: opts.severity } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    include: {
      employee: { select: { empId: true, name: true } },
      vendor: { select: { code: true, legalName: true } },
      cycle: { select: { label: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    severity: r.severity,
    status: r.status,
    confidence: r.confidence,
    title: r.title,
    summary: r.summary,
    narrative: r.narrative,
    scriptedResponseKey: r.scriptedResponseKey,
    raisedAt: r.raisedAt,
    employee: r.employee,
    vendor: r.vendor,
    cycle: r.cycle,
  }));
}

export const PAYROLL_ANOMALY_KINDS = PAYROLL_KINDS;
