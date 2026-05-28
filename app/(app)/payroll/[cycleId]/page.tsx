import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { GenerateRegisterDrawer } from "@/components/payroll/GenerateRegisterDrawer";
import { getCycleDetail } from "@/lib/payroll";
import { getRegisterGate } from "@/lib/register";
import { formatInr, formatInrCompact, formatCycle, formatDate } from "@/lib/format";
import { ChevronLeft, Receipt, AlertTriangle, Users } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ cycleId: string }>;
}

export default async function CycleDetailPage({ params }: Props) {
  const { cycleId } = await params;
  const detail = await getCycleDetail(cycleId);
  if (!detail) notFound();
  const gate = await getRegisterGate(cycleId);

  return (
    <>
      <Topbar pageTitle={`Payroll · ${formatCycle(detail.cycle.label)}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All cycles
          </Link>

          {/* Header card */}
          <section className="flex items-start justify-between gap-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                Cycle
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="font-mono text-[24px] font-semibold text-[var(--ink-900)]">
                  {formatCycle(detail.cycle.label)}
                </h1>
                <StatusPill
                  tone={detail.cycle.state === "OPEN" ? "ok" : detail.cycle.state === "LOCKED" ? "info" : "neutral"}
                  label={detail.cycle.state}
                />
              </div>
              <p className="mt-1 text-[12px] text-[var(--ink-500)]">
                {formatDate(detail.cycle.periodStart)} – {formatDate(detail.cycle.periodEnd)} · {detail.cycle.totalDays} days
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/payroll/${detail.cycle.label}/anomalies`}
                className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
              >
                Open anomalies ({detail.topAnomalies.length})
              </Link>
              {gate && (
                <GenerateRegisterDrawer
                  gate={{
                    cycleLabel: gate.cycleLabel,
                    cycleState: gate.cycleState,
                    employeeCount: gate.employeeCount,
                    totalGrossPaise: String(gate.totalGrossPaise),
                    totalDeductionsPaise: String(gate.totalDeductionsPaise),
                    totalNetPayPaise: String(gate.totalNetPayPaise),
                    totalReimbursementPaise: String(gate.totalReimbursementPaise),
                    totalPayoutPaise: String(gate.totalPayoutPaise),
                    openAnomalies: gate.openAnomalies,
                    acknowledgedAnomalies: gate.acknowledgedAnomalies,
                    dismissedAnomalies: gate.dismissedAnomalies,
                    lockedAtIso: gate.lockedAt ? gate.lockedAt.toISOString() : null,
                  }}
                />
              )}
            </div>
          </section>

          {/* KPI strip */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Total payout" value={formatInrCompact(detail.payoutPaise)} sub={formatInr(detail.payoutPaise)} />
            <Tile label="Gross" value={formatInrCompact(detail.grossPaise)} sub={formatInr(detail.grossPaise)} />
            <Tile label="Deductions" value={formatInrCompact(detail.totalDeductionsPaise)} sub={formatInr(detail.totalDeductionsPaise)} />
            <Tile label="Reimbursements" value={formatInrCompact(detail.totalReimbursementsPaise)} sub={formatInr(detail.totalReimbursementsPaise)} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Counter icon={Users} label="Employees paid" value={detail.employeeCount} />
            <Counter icon={Receipt} label="With LWP" value={detail.withLwpCount} sub="Leave Without Pay days" />
            <Counter icon={AlertTriangle} label="Joiners + exits" value={detail.newJoinerCount + detail.exitCount} sub={`${detail.newJoinerCount} joined · ${detail.exitCount} exited`} />
          </section>

          {/* Runs */}
          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
              Payroll runs ({detail.runs.length})
            </h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Type</th>
                    <th className="px-4 py-2.5 text-left font-medium">Run date</th>
                    <th className="px-4 py-2.5 text-right font-medium">Lines</th>
                    <th className="px-4 py-2.5 text-right font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.runs.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]"
                    >
                      <td className="px-4 py-3">
                        <StatusPill
                          tone={r.runType === "REGULAR" ? "ok" : r.runType === "CORRECTION" ? "bad" : "info"}
                          label={r.runType}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--ink-700)]">
                        {formatDate(r.runDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">
                        {r.lineCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">
                        {formatInr(r.payoutPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top anomalies */}
          {detail.topAnomalies.length > 0 && (
            <section>
              <header className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                  Top open anomalies
                </h2>
                <Link
                  href={`/payroll/${detail.cycle.label}/anomalies`}
                  className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                >
                  View all →
                </Link>
              </header>
              <ul className="mt-3 space-y-2">
                {detail.topAnomalies.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (a.severity === "CRITICAL"
                          ? "bg-[var(--bad-dot)]"
                          : a.severity === "HIGH"
                            ? "bg-[var(--warn-dot)]"
                            : a.severity === "MEDIUM"
                              ? "bg-[var(--info-dot)]"
                              : "bg-[var(--neutral-dot)]")
                      }
                    />
                    <StatusPill
                      tone={a.severity === "CRITICAL" ? "bad" : a.severity === "HIGH" ? "warn" : "info"}
                      label={a.severity}
                    />
                    <span className="flex-1 text-[13px] text-[var(--ink-900)]">{a.title}</span>
                    <span className="font-mono text-[11px] text-[var(--ink-500)]">{a.kind}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[24px] font-semibold tabular text-[var(--ink-900)]">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[11px] text-[var(--ink-500)]">{sub}</div>
      )}
    </div>
  );
}

function Counter({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
        <Icon className="h-4 w-4 text-[var(--navy-700)]" />
      </div>
      <div className="flex-1">
        <div className="text-[12px] text-[var(--ink-500)]">{label}</div>
        <div className="font-mono text-[18px] font-semibold tabular text-[var(--ink-900)]">{value}</div>
        {sub && <div className="text-[11px] text-[var(--ink-500)]">{sub}</div>}
      </div>
    </div>
  );
}
