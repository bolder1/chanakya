import { Topbar } from "@/components/chrome/Topbar";
import { AnomalyInbox } from "@/components/anomaly/AnomalyInbox";
import {
  listAnomaliesInbox,
  getAnomalyFacets,
  type AnomalyScope,
  type AnomalyFilters,
} from "@/lib/anomalies-query";
import { requireCap } from "@/lib/session";
import type { AnomalyKind, AnomalySeverity, AnomalyStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    scope?: string;
    status?: string;
    severity?: string;
    kind?: string;
    cycleLabel?: string;
  }>;
}

export default async function AnomaliesPage({ searchParams }: Props) {
  await requireCap("anomaly.view");
  const sp = await searchParams;

  const filters: AnomalyFilters = {
    scope: ((["all", "payroll", "vendor", "spend"] as const).includes(
      sp.scope as AnomalyScope,
    )
      ? sp.scope
      : "all") as AnomalyScope,
    status: (sp.status as AnomalyStatus) ?? "ALL",
    severity: (sp.severity as AnomalySeverity) ?? "ALL",
    kind: (sp.kind as AnomalyKind) ?? "ALL",
    cycleLabel: sp.cycleLabel ?? "ALL",
  };

  const [rows, facets] = await Promise.all([
    listAnomaliesInbox(filters),
    getAnomalyFacets(),
  ]);

  const serialized = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    scope: r.scope,
    severity: r.severity,
    status: r.status,
    confidence: r.confidence,
    title: r.title,
    summary: r.summary,
    narrative: r.narrative,
    raisedAtIso: r.raisedAt.toISOString(),
    employee: r.employee,
    vendor: r.vendor,
    cycle: r.cycle,
    invoice: r.invoice,
  }));

  const total = rows.length;
  const open = rows.filter((r) => r.status === "OPEN").length;
  const critical = rows.filter((r) => r.severity === "CRITICAL").length;
  const high = rows.filter((r) => r.severity === "HIGH").length;

  return (
    <>
      <Topbar pageTitle="Anomalies" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
          {/* Hero strip */}
          <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                All anomalies
              </div>
              <div className="font-mono text-[24px] font-semibold text-[var(--ink-900)]">
                {total}
              </div>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <Stat label="Open" value={String(open)} accent={open > 0} />
            <Stat label="Critical" value={String(critical)} accent={critical > 0} />
            <Stat label="High" value={String(high)} accent={high > 0} />
            <div className="ml-auto max-w-md text-[12px] text-[var(--ink-500)]">
              Cross-domain inbox — payroll · vendor · spend. Filter, bulk-acknowledge,
              dismiss with reason, export.
            </div>
          </section>

          <AnomalyInbox
            rows={serialized}
            facets={{
              cycleLabels: facets.cycleLabels,
              kinds: facets.kinds,
            }}
            initialFilters={{
              scope: filters.scope,
              status: filters.status,
              severity: filters.severity,
              kind: filters.kind,
              cycleLabel: filters.cycleLabel,
            }}
          />
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
        {label}
      </div>
      <div
        className={
          "mt-0.5 font-mono text-[18px] font-semibold tabular " +
          (accent ? "text-[var(--warn-fg)]" : "text-[var(--ink-900)]")
        }
      >
        {value}
      </div>
    </div>
  );
}
