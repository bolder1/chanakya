import { prisma } from "@/lib/db";

const SPEND_KINDS = [
  "SPEND_CATEGORY_VARIANCE",
  "SPEND_UNIT_PRICE_DRIFT",
  "SPEND_OFF_CONTRACT",
  "SPEND_SPLIT_PURCHASE",
] as const;

export interface CategoryCard {
  id: string;
  name: string;
  monthlyBudgetPaise: bigint;
  owner: string | null;
  currentMonthSpendPaise: bigint;
  trailing6mAvgPaise: bigint;
  variancePct: number;
  monthlyTrend: bigint[]; // last 12 months
  openAnomalyCount: number;
}

export async function listCategoryCards(): Promise<CategoryCard[]> {
  const categories = await prisma.procurementCategory.findMany({
    orderBy: { name: "asc" },
  });

  const activeCycle = await prisma.cycle.findFirst({
    where: { state: "OPEN" },
    orderBy: { periodEnd: "desc" },
  });

  const out: CategoryCard[] = [];
  for (const c of categories) {
    // Current month spend = active cycle period
    const currentStart = activeCycle?.periodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentEnd = activeCycle?.periodEnd ?? new Date();

    const [currentAgg, last6Agg, last12Months] = await Promise.all([
      prisma.procurementEntry.aggregate({
        where: { categoryId: c.id, occurredOn: { gte: currentStart, lte: currentEnd } },
        _sum: { totalPaise: true },
      }),
      // Trailing 6 months prior to current
      prisma.procurementEntry.aggregate({
        where: {
          categoryId: c.id,
          occurredOn: {
            gte: subMonths(currentStart, 6),
            lt: currentStart,
          },
        },
        _sum: { totalPaise: true },
      }),
      // 12 months of data for sparkline
      prisma.procurementEntry.findMany({
        where: {
          categoryId: c.id,
          occurredOn: { gte: subMonths(currentEnd, 11) },
        },
        select: { occurredOn: true, totalPaise: true },
      }),
    ]);

    const monthlyTrend = bucketByMonth(last12Months, currentEnd, 12);
    const currentMonthSpend = currentAgg._sum.totalPaise ?? 0n;
    const trailing6mTotal = last6Agg._sum.totalPaise ?? 0n;
    const trailing6mAvg = trailing6mTotal / 6n;
    const variancePct = trailing6mAvg > 0n
      ? Number(((currentMonthSpend - trailing6mAvg) * 10000n) / trailing6mAvg) / 100
      : 0;

    const openAnomalyCount = await prisma.anomaly.count({
      where: {
        status: "OPEN",
        kind: { in: [...SPEND_KINDS] },
        narrative: { contains: c.name, mode: "insensitive" },
      },
    });

    out.push({
      id: c.id,
      name: c.name,
      monthlyBudgetPaise: c.monthlyBudgetPaise,
      owner: c.owner,
      currentMonthSpendPaise: currentMonthSpend,
      trailing6mAvgPaise: trailing6mAvg,
      variancePct,
      monthlyTrend,
      openAnomalyCount,
    });
  }
  return out;
}

export async function getCategoryDetail(categoryId: string) {
  const category = await prisma.procurementCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) return null;

  const activeCycle = await prisma.cycle.findFirst({
    where: { state: "OPEN" },
    orderBy: { periodEnd: "desc" },
  });

  const last12Start = subMonths(new Date(), 11);

  const [entries, vendorsAgg, monthlyEntries] = await Promise.all([
    prisma.procurementEntry.findMany({
      where: { categoryId: category.id },
      orderBy: { occurredOn: "desc" },
      include: { vendor: { select: { code: true, legalName: true } } },
      take: 100,
    }),
    prisma.procurementEntry.groupBy({
      by: ["vendorId"],
      where: { categoryId: category.id, occurredOn: { gte: last12Start } },
      _sum: { totalPaise: true },
    }),
    prisma.procurementEntry.findMany({
      where: { categoryId: category.id, occurredOn: { gte: last12Start } },
      select: { occurredOn: true, totalPaise: true, unitPricePaise: true, quantity: true, description: true },
    }),
  ]);

  const vendorIds = vendorsAgg.map((v) => v.vendorId).filter((v): v is string => !!v);
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, code: true, legalName: true },
  });
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  const vendorRows = vendorsAgg
    .filter((v) => v.vendorId)
    .map((v) => ({
      vendorId: v.vendorId as string,
      code: vendorMap.get(v.vendorId as string)?.code ?? "—",
      legalName: vendorMap.get(v.vendorId as string)?.legalName ?? "—",
      totalPaise: v._sum.totalPaise ?? 0n,
    }))
    .sort((a, b) => Number(b.totalPaise - a.totalPaise));

  const monthlyTrend = bucketByMonth(monthlyEntries, new Date(), 12);

  // Unit price trend for the dominant description (mode)
  const descCounts = new Map<string, number>();
  for (const e of monthlyEntries) descCounts.set(e.description, (descCounts.get(e.description) ?? 0) + 1);
  const dominantDesc = [...descCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  let unitPriceTrend: { label: string; value: number; highlight?: boolean }[] = [];
  if (dominantDesc) {
    const byWeek = new Map<string, { sum: bigint; count: number }>();
    for (const e of monthlyEntries) {
      if (e.description !== dominantDesc) continue;
      const week = isoWeekKey(e.occurredOn);
      const cur = byWeek.get(week) ?? { sum: 0n, count: 0 };
      cur.sum += e.unitPricePaise;
      cur.count++;
      byWeek.set(week, cur);
    }
    unitPriceTrend = [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, v]) => ({
        label: wk,
        value: Number(v.sum / BigInt(v.count)),
      }));
    // Highlight last point if it's >30% above median
    if (unitPriceTrend.length > 3) {
      const values = unitPriceTrend.map((p) => p.value);
      const median = values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
      const last = unitPriceTrend[unitPriceTrend.length - 1];
      if (last && median && last.value > median * 1.3) {
        last.highlight = true;
      }
    }
  }

  // Anomalies referencing this category by name in narrative
  const anomalies = await prisma.anomaly.findMany({
    where: {
      kind: { in: [...SPEND_KINDS] },
      narrative: { contains: category.name, mode: "insensitive" },
    },
    orderBy: { raisedAt: "desc" },
  });

  return { category, entries, vendorRows, monthlyTrend, unitPriceTrend, dominantDesc, anomalies };
}

export async function listAllSpendAnomalies() {
  return prisma.anomaly.findMany({
    where: { status: { in: ["OPEN", "ACKNOWLEDGED"] }, kind: { in: [...SPEND_KINDS] } },
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    include: {
      vendor: { select: { code: true, legalName: true } },
    },
  });
}

function subMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() - n);
  return r;
}

function bucketByMonth(
  entries: Array<{ occurredOn: Date; totalPaise: bigint }>,
  endDate: Date,
  months: number,
): bigint[] {
  const buckets: bigint[] = Array(months).fill(0n);
  for (const e of entries) {
    const monthDiff =
      (endDate.getFullYear() - e.occurredOn.getFullYear()) * 12 +
      (endDate.getMonth() - e.occurredOn.getMonth());
    if (monthDiff >= 0 && monthDiff < months) {
      const idx = months - 1 - monthDiff;
      buckets[idx] = (buckets[idx] ?? 0n) + e.totalPaise;
    }
  }
  return buckets;
}

function isoWeekKey(d: Date): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
