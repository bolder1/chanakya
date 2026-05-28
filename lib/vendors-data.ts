import { prisma } from "@/lib/db";

const VENDOR_INVOICE_KINDS = [
  "INVOICE_MISSING_LINES",
  "INVOICE_DUPLICATE",
  "INVOICE_PRICE_DRIFT",
  "INVOICE_DEDUCTION_MISMATCH",
  "INVOICE_TAX_INCONSISTENT",
  "INVOICE_GST_INVALID",
] as const;

export async function listVendorsWithRollup() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  const results = [];
  for (const v of vendors) {
    const [invoiceAgg, invoiceCount, openAnomalyCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { vendorId: v.id },
        _sum: { totalPaise: true },
      }),
      prisma.invoice.count({ where: { vendorId: v.id } }),
      prisma.anomaly.count({
        where: { vendorId: v.id, status: "OPEN", kind: { in: [...VENDOR_INVOICE_KINDS] } },
      }),
    ]);
    results.push({
      id: v.id,
      code: v.code,
      legalName: v.legalName,
      category: v.category,
      status: v.status,
      gstin: v.gstin,
      paymentTermsDays: v.paymentTermsDays,
      ytdSpendPaise: invoiceAgg._sum.totalPaise ?? 0n,
      invoiceCount,
      openAnomalyCount,
    });
  }
  return results;
}

export async function getVendorByCode(code: string) {
  const vendor = await prisma.vendor.findUnique({ where: { code } });
  if (!vendor) return null;

  const [invoices, anomalies, spendAgg] = await Promise.all([
    prisma.invoice.findMany({
      where: { vendorId: vendor.id },
      orderBy: { receivedOn: "desc" },
    }),
    prisma.anomaly.findMany({
      where: { vendorId: vendor.id, kind: { in: [...VENDOR_INVOICE_KINDS] } },
      orderBy: { raisedAt: "desc" },
    }),
    prisma.invoice.aggregate({
      where: { vendorId: vendor.id },
      _sum: { totalPaise: true, taxPaise: true, tdsPaise: true },
    }),
  ]);

  // Build month-over-month spend timeline (last 18 months from latest invoice)
  const monthly = new Map<string, bigint>();
  for (const inv of invoices) {
    const key = `${inv.receivedOn.getFullYear()}-${String(inv.receivedOn.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, (monthly.get(key) ?? 0n) + inv.totalPaise);
  }
  const timeline = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, paise]) => ({ month, paise }));

  return { vendor, invoices, anomalies, spendAgg, timeline };
}

export async function getInvoiceById(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: { orderBy: { lineNo: "asc" } },
      vendor: true,
      po: { include: { lines: { orderBy: { lineNo: "asc" } } } },
      anomalies: true,
    },
  });
}

export async function listAllVendorAnomalies() {
  return prisma.anomaly.findMany({
    where: { status: { in: ["OPEN", "ACKNOWLEDGED"] }, kind: { in: [...VENDOR_INVOICE_KINDS] } },
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    include: {
      vendor: { select: { code: true, legalName: true } },
      invoice: { select: { invoiceNumber: true, id: true } },
    },
  });
}

export const VENDOR_ANOMALY_KINDS = VENDOR_INVOICE_KINDS;
