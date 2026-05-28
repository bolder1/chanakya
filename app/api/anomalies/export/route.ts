import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listAnomaliesInbox,
  buildAnomalyCsv,
  type AnomalyScope,
  type AnomalyFilters,
} from "@/lib/anomalies-query";
import { prisma } from "@/lib/db";
import type { AnomalyKind, AnomalySeverity, AnomalyStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters: AnomalyFilters = {
    scope: ((["all", "payroll", "vendor", "spend"] as const).includes(
      sp.get("scope") as AnomalyScope,
    )
      ? sp.get("scope")
      : "all") as AnomalyScope,
    status: ((sp.get("status") as AnomalyStatus) ?? "ALL") as AnomalyStatus | "ALL",
    severity: ((sp.get("severity") as AnomalySeverity) ?? "ALL") as AnomalySeverity | "ALL",
    kind: ((sp.get("kind") as AnomalyKind) ?? "ALL") as AnomalyKind | "ALL",
    cycleLabel: sp.get("cycleLabel") ?? "ALL",
  };

  const rows = await listAnomaliesInbox(filters);
  const csv = buildAnomalyCsv(rows);

  await prisma.auditEntry.create({
    data: {
      actorId: (session.user as { id: string }).id,
      actorRole: (session.user as { role: "CFO_FINANCE" | "HR_OPS" | "VENDOR_MGR" | "OPS_MGR" | "LEADERSHIP_RO" | "SYS_ADMIN" }).role,
      action: "anomalies.export",
      objectType: "Anomaly",
      objectId: "filtered-set",
      after: {
        rowCount: rows.length,
        filters: {
          scope: filters.scope,
          status: filters.status,
          severity: filters.severity,
          kind: filters.kind,
          cycleLabel: filters.cycleLabel,
        },
      } as unknown as object,
    },
  }).catch(() => {/* don't block download */});

  const filename = `chanakya-anomalies-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
