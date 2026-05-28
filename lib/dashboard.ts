import { prisma } from "@/lib/db";

export interface DashboardData {
  cycle: {
    label: string;
    state: string;
    daysToClose: number;
  } | null;
  kpis: {
    cyclePayoutPaise: bigint;
    vendorSpendYtdPaise: bigint;
    opsSpendMtdPaise: bigint;
    openAnomalies: number;
    criticalCount: number;
    highCount: number;
  };
  recentAnomalies: Array<{
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    narrative: string;
    confidence: 1 | 2 | 3 | 4 | 5;
    citations: { label: string; href?: string }[];
    raisedAtRelative: string;
  }>;
  aiSnapshot: string;
}

/** Read dashboard data from Prisma. Returns null-shaped values when DB is empty. */
export async function getDashboardData(): Promise<DashboardData> {
  // Prefer the most recent OPEN cycle; fall back to most recent of any state
  // so a freshly-locked cycle still shows its data instead of an empty state.
  const cycle =
    (await prisma.cycle.findFirst({
      where: { state: "OPEN" },
      orderBy: { periodEnd: "desc" },
    })) ??
    (await prisma.cycle.findFirst({ orderBy: { periodEnd: "desc" } }));

  if (!cycle) {
    return emptyDashboard();
  }

  const cycleId = cycle.id;

  // KPI 1: total NET PAY for the active cycle
  const payoutAgg = await prisma.payrollLine.aggregate({
    where: { run: { cycleId } },
    _sum: { netPayPaise: true },
  });

  // KPI 2: vendor spend YTD (sum of all invoice totals in this calendar year)
  const yearStart = new Date(cycle.periodStart.getFullYear(), 0, 1);
  const vendorAgg = await prisma.invoice.aggregate({
    where: { receivedOn: { gte: yearStart } },
    _sum: { totalPaise: true },
  });

  // KPI 3: ops spend MTD (procurement entries in active cycle period)
  const opsAgg = await prisma.procurementEntry.aggregate({
    where: {
      occurredOn: { gte: cycle.periodStart, lte: cycle.periodEnd },
    },
    _sum: { totalPaise: true },
  });

  // KPI 4 & severity counts
  const anomalyCountsBySev = await prisma.anomaly.groupBy({
    by: ["severity"],
    where: { status: "OPEN", cycleId },
    _count: true,
  });
  const openAnomalies = anomalyCountsBySev.reduce((acc, c) => acc + c._count, 0);
  const criticalCount =
    anomalyCountsBySev.find((c) => c.severity === "CRITICAL")?._count ?? 0;
  const highCount =
    anomalyCountsBySev.find((c) => c.severity === "HIGH")?._count ?? 0;

  // Most-recent anomalies (top 4 by severity then raisedAt)
  const recent = await prisma.anomaly.findMany({
    where: { status: "OPEN", cycleId },
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    take: 4,
    include: {
      employee: { select: { empId: true, name: true } },
      vendor: { select: { code: true } },
      cycle: { select: { label: true } },
    },
  });

  const recentAnomalies = recent.map((a) => ({
    id: a.id,
    severity: a.severity,
    title: a.title,
    narrative: a.narrative,
    confidence: (Math.max(1, Math.min(5, a.confidence)) as 1 | 2 | 3 | 4 | 5),
    citations: [
      a.employee && { label: a.employee.empId, href: `/payroll/employees/${a.employee.empId}` },
      a.vendor && { label: a.vendor.code, href: `/vendors/${a.vendor.code}` },
      a.cycle && { label: a.cycle.label },
    ].filter((c): c is { label: string; href?: string } => c !== null && c !== undefined),
    raisedAtRelative: relativeTime(a.raisedAt),
  }));

  // AI snapshot — single sentence keyed off counts
  const aiSnapshot = `${openAnomalies} open anomalies across Payroll, Attendance, Shift, Hostel, Vendors and Spend — ${criticalCount} critical, ${highCount} high.`;

  // Days until cycle close
  const daysToClose = Math.max(
    0,
    Math.ceil((cycle.periodEnd.getTime() - Date.now()) / 86_400_000),
  );

  return {
    cycle: {
      label: cycle.label,
      state: cycle.state,
      daysToClose,
    },
    kpis: {
      cyclePayoutPaise: payoutAgg._sum.netPayPaise ?? 0n,
      vendorSpendYtdPaise: vendorAgg._sum.totalPaise ?? 0n,
      opsSpendMtdPaise: opsAgg._sum.totalPaise ?? 0n,
      openAnomalies,
      criticalCount,
      highCount,
    },
    recentAnomalies,
    aiSnapshot,
  };
}

function emptyDashboard(): DashboardData {
  return {
    cycle: null,
    kpis: {
      cyclePayoutPaise: 0n,
      vendorSpendYtdPaise: 0n,
      opsSpendMtdPaise: 0n,
      openAnomalies: 0,
      criticalCount: 0,
      highCount: 0,
    },
    recentAnomalies: [],
    aiSnapshot: "Database is empty. Run pnpm db:seed to populate.",
  };
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-IN");
}
