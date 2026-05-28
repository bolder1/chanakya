import { prisma } from "@/lib/db";
import type { AnomalyKind, AnomalySeverity, AnomalyStatus } from "@prisma/client";
import { PAYROLL_ANOMALY_KINDS } from "@/lib/payroll";

export type AnomalyScope = "all" | "payroll" | "vendor" | "spend";

const VENDOR_KINDS: AnomalyKind[] = [
  "INVOICE_MISSING_LINES",
  "INVOICE_DUPLICATE",
  "INVOICE_PRICE_DRIFT",
  "INVOICE_DEDUCTION_MISMATCH",
  "INVOICE_TAX_INCONSISTENT",
  "INVOICE_GST_INVALID",
];

const SPEND_KINDS: AnomalyKind[] = [
  "SPEND_CATEGORY_VARIANCE",
  "SPEND_UNIT_PRICE_DRIFT",
  "SPEND_OFF_CONTRACT",
  "SPEND_SPLIT_PURCHASE",
];

export interface AnomalyFilters {
  scope: AnomalyScope;
  status: AnomalyStatus | "ALL";
  severity: AnomalySeverity | "ALL";
  kind: AnomalyKind | "ALL";
  cycleLabel: string | "ALL";
}

export interface AnomalyInboxRow {
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
  scope: AnomalyScope;
  employee: { empId: string; name: string } | null;
  vendor: { code: string; legalName: string } | null;
  cycle: { label: string } | null;
  invoice: { id: string; invoiceNumber: string; vendorCode: string } | null;
}

function scopeKinds(scope: AnomalyScope): AnomalyKind[] | undefined {
  if (scope === "payroll") return PAYROLL_ANOMALY_KINDS;
  if (scope === "vendor") return VENDOR_KINDS;
  if (scope === "spend") return SPEND_KINDS;
  return undefined;
}

function scopeOf(kind: AnomalyKind): AnomalyScope {
  if (VENDOR_KINDS.includes(kind)) return "vendor";
  if (SPEND_KINDS.includes(kind)) return "spend";
  return "payroll";
}

export async function listAnomaliesInbox(filters: AnomalyFilters) {
  const kinds = filters.kind !== "ALL"
    ? [filters.kind]
    : scopeKinds(filters.scope);

  const where: {
    status?: AnomalyStatus;
    severity?: AnomalySeverity;
    kind?: { in: AnomalyKind[] };
    cycle?: { label: string };
  } = {};

  if (filters.status !== "ALL") where.status = filters.status;
  if (filters.severity !== "ALL") where.severity = filters.severity;
  if (kinds && kinds.length > 0) where.kind = { in: kinds };
  if (filters.cycleLabel !== "ALL") where.cycle = { label: filters.cycleLabel };

  const rows = await prisma.anomaly.findMany({
    where,
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    include: {
      employee: { select: { empId: true, name: true } },
      vendor: { select: { code: true, legalName: true } },
      cycle: { select: { label: true } },
      invoice: { select: { id: true, invoiceNumber: true, vendor: { select: { code: true } } } },
    },
  });

  const result: AnomalyInboxRow[] = rows.map((r) => ({
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
    scope: scopeOf(r.kind),
    employee: r.employee,
    vendor: r.vendor,
    cycle: r.cycle,
    invoice: r.invoice
      ? {
          id: r.invoice.id,
          invoiceNumber: r.invoice.invoiceNumber,
          vendorCode: r.invoice.vendor.code,
        }
      : null,
  }));

  return result;
}

export async function getAnomalyFacets() {
  const [statusCounts, severityCounts, kinds, cycles] = await Promise.all([
    prisma.anomaly.groupBy({ by: ["status"], _count: true }),
    prisma.anomaly.groupBy({ by: ["severity"], _count: true }),
    prisma.anomaly.groupBy({ by: ["kind"], _count: true, orderBy: { _count: { kind: "desc" } } }),
    prisma.anomaly.findMany({
      where: { cycleId: { not: null } },
      select: { cycle: { select: { label: true } } },
      distinct: ["cycleId"],
    }),
  ]);

  return {
    statusCounts,
    severityCounts,
    kinds: kinds.map((k) => k.kind),
    cycleLabels: Array.from(new Set(cycles.map((c) => c.cycle?.label).filter((l): l is string => !!l))).sort().reverse(),
  };
}

export function buildAnomalyCsv(rows: AnomalyInboxRow[]): string {
  const headers = [
    "id",
    "kind",
    "scope",
    "severity",
    "status",
    "confidence",
    "title",
    "summary",
    "cycle",
    "employee",
    "vendor",
    "raised_at",
  ];

  const escape = (s: string) =>
    /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.kind,
        r.scope,
        r.severity,
        r.status,
        String(r.confidence),
        r.title,
        r.summary,
        r.cycle?.label ?? "",
        r.employee ? `${r.employee.empId} ${r.employee.name}` : "",
        r.vendor ? `${r.vendor.code} ${r.vendor.legalName}` : "",
        r.raisedAt.toISOString(),
      ].map(escape).join(","),
    );
  }
  return lines.join("\n") + "\n";
}
