import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { listCyclesWithSummary } from "@/lib/payroll";
import { formatInrCompact, formatCycle, formatDate } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";


export default async function PayrollPage() {
  const cycles = await listCyclesWithSummary();
  const activeCycle = cycles.find((c) => c.state === "OPEN");

  return (
    <>
      <Topbar pageTitle="Payroll" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
              Active cycle
            </h2>
            {activeCycle ? (
              <Link
                href={`/payroll/${activeCycle.label}`}
                className="mt-3 flex items-stretch overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] hover:border-[var(--border-strong)]"
              >
                <div className="flex flex-1 items-center gap-6 px-5 py-4">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                      Cycle
                    </div>
                    <div className="mt-1 font-mono text-[20px] font-semibold text-[var(--ink-900)]">
                      {formatCycle(activeCycle.label)}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-[var(--border)]" />
                  <Stat label="Payout" value={formatInrCompact(activeCycle.payoutPaise)} mono />
                  <Stat label="Employees" value={String(activeCycle.employeeCount)} mono />
                  <Stat
                    label="Open anomalies"
                    value={String(activeCycle.payrollAnomalyCount)}
                    mono
                    accent={activeCycle.payrollAnomalyCount > 0}
                  />
                  <StatusPill tone="ok" label="OPEN" />
                </div>
                <div className="grid place-items-center bg-[var(--bg-surface-2)] px-4">
                  <ChevronRight className="h-4 w-4 text-[var(--ink-500)]" />
                </div>
              </Link>
            ) : (
              <div className="mt-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white p-6 text-center text-[13px] text-[var(--ink-500)]">
                No open cycle.
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
              All cycles ({cycles.length})
            </h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Cycle</th>
                    <th className="px-4 py-2.5 text-left font-medium">Period</th>
                    <th className="px-4 py-2.5 text-right font-medium">Employees</th>
                    <th className="px-4 py-2.5 text-right font-medium">Payout</th>
                    <th className="px-4 py-2.5 text-right font-medium">Anomalies</th>
                    <th className="px-4 py-2.5 text-left font-medium">State</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]"
                    >
                      <td className="px-4 py-3 font-mono text-[var(--ink-900)]">
                        {formatCycle(c.label)}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">
                        {formatDate(c.periodStart)} – {formatDate(c.periodEnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">
                        {c.employeeCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">
                        {formatInrCompact(c.payoutPaise)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular">
                        {c.payrollAnomalyCount > 0 ? (
                          <span className="text-[var(--warn-fg)]">
                            {c.payrollAnomalyCount}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-400)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          tone={c.state === "OPEN" ? "ok" : c.state === "LOCKED" ? "info" : "neutral"}
                          label={c.state}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/payroll/${c.label}`}
                          className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                        >
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
        {label}
      </div>
      <div
        className={
          (mono ? "font-mono tabular " : "") +
          "mt-0.5 text-[15px] font-semibold " +
          (accent ? "text-[var(--warn-fg)]" : "text-[var(--ink-900)]")
        }
      >
        {value}
      </div>
    </div>
  );
}
