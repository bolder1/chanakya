import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { KpiTile } from "@/components/kpi/KpiTile";
import { AnomalyCard } from "@/components/anomaly/AnomalyCard";
import { StatusPill } from "@/components/status/StatusPill";
import { GenerateRegisterDrawer } from "@/components/payroll/GenerateRegisterDrawer";
import { formatInrCompact, formatCycle } from "@/lib/format";
import { getDashboardData } from "@/lib/dashboard";
import { getRegisterGate } from "@/lib/register";
import {
  Sparkles,
  AlertTriangle,
  Receipt,
  Building2,
  ShoppingCart,
} from "lucide-react";

export const dynamic = "force-dynamic"; // always fresh while we're in W2 demo mode

export default async function DashboardPage() {
  const data = await getDashboardData();
  const gate = data.cycle ? await getRegisterGate(data.cycle.label) : null;

  return (
    <>
      <Topbar pageTitle="Dashboard" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {/* Cycle status strip */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  Active cycle
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="font-mono text-[20px] font-semibold text-[var(--ink-900)]">
                    {data.cycle ? formatCycle(data.cycle.label) : "No active cycle"}
                  </h2>
                  {data.cycle && (
                    <>
                      <StatusPill
                        tone={
                          data.cycle.state === "OPEN"
                            ? "ok"
                            : data.cycle.state === "LOCKED"
                              ? "info"
                              : "neutral"
                        }
                        label={data.cycle.state}
                      />
                      <span className="text-[12px] text-[var(--ink-500)]">
                        {data.cycle.state === "OPEN"
                          ? `closes in ${data.cycle.daysToClose} day${data.cycle.daysToClose === 1 ? "" : "s"}`
                          : "register exported"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-2 hidden h-12 w-px bg-[var(--border)] sm:block" />
              <div className="hidden sm:block">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  AI snapshot
                </div>
                <p className="mt-1 max-w-md text-[12px] leading-snug text-[var(--ink-700)]">
                  <Sparkles className="mr-1 inline h-3 w-3 text-[var(--saffron-500)]" />
                  {data.aiSnapshot}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data.cycle && (
                <Link
                  href={`/payroll/${data.cycle.label}`}
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
                >
                  Cycle detail
                </Link>
              )}
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

          {/* KPI grid */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label={data.cycle ? `${formatCycle(data.cycle.label)} payout` : "Cycle payout"}
              value={formatInrCompact(data.kpis.cyclePayoutPaise)}
              deltaPct={4.1}
              deltaLabel="vs prior cycle"
            />
            <KpiTile
              label="Vendor spend (YTD)"
              value={formatInrCompact(data.kpis.vendorSpendYtdPaise)}
              deltaPct={12.7}
              deltaLabel="vs LY"
            />
            <KpiTile
              label="Ops spend (MTD)"
              value={formatInrCompact(data.kpis.opsSpendMtdPaise)}
              deltaPct={-3.4}
              deltaLabel="vs prior cycle"
            />
            <KpiTile
              label="Open anomalies"
              value={String(data.kpis.openAnomalies)}
              deltaPct={data.kpis.openAnomalies > 0 ? 9 : 0}
              deltaLabel={`${data.kpis.criticalCount} critical · ${data.kpis.highCount} high`}
              accent
            />
          </section>

          {/* Two-column area */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <header className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                  Recent anomalies
                </h2>
                <a
                  href="#"
                  className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                >
                  View all {data.kpis.openAnomalies} →
                </a>
              </header>
              <div className="space-y-3">
                {data.recentAnomalies.length === 0 && (
                  <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white p-8 text-center text-[13px] text-[var(--ink-500)]">
                    No anomalies in this cycle. The cycle is clean.
                  </div>
                )}
                {data.recentAnomalies.map((a) => (
                  <AnomalyCard
                    key={a.id}
                    id={a.id}
                    severity={a.severity}
                    title={a.title}
                    narrative={a.narrative}
                    confidence={a.confidence}
                    citations={a.citations}
                    raisedAt={a.raisedAtRelative}
                    href="#"
                  />
                ))}
              </div>
            </div>

            {/* Right rail */}
            <aside className="space-y-4">
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ink-900)]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                  Needs your attention
                </h3>
                <ul className="mt-3 space-y-3 text-[12px]">
                  <AttentionRow
                    icon={Receipt}
                    label={`${data.kpis.criticalCount + data.kpis.highCount} high-severity payroll items`}
                    sub={data.cycle ? formatCycle(data.cycle.label) + " cycle" : "Open"}
                  />
                  <AttentionRow
                    icon={Building2}
                    label="Vendor invoices flagged for review"
                    sub="Header-vs-line + duplicate + drift"
                  />
                  <AttentionRow
                    icon={ShoppingCart}
                    label="Spend variances unresolved"
                    sub="Laptops, Vegetables, Catering"
                  />
                </ul>
              </div>

              <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--saffron-50)] p-4 shadow-[var(--shadow-card)]">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ink-900)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                  Ask Chanakya
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-700)]">
                  Try a question across payroll, vendors, and spend.
                </p>
                <div className="mt-3 space-y-1.5">
                  {[
                    "Why did Aarav Mehta's salary double?",
                    "Show me anomalies in vendor invoices",
                    "How much did we spend on laptops in April?",
                  ].map((q) => (
                    <button
                      key={q}
                      className="block w-full rounded-md border border-[var(--saffron-300)] bg-white/60 px-2.5 py-1.5 text-left text-[12px] text-[var(--ink-700)] hover:bg-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <footer className="pt-4 text-center text-[11px] text-[var(--ink-500)]">
            Chanakya · running on MiniOrange infrastructure · AI is advisory; humans approve
          </footer>
        </div>
      </main>
    </>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
        <Icon className="h-3 w-3 text-[var(--navy-700)]" />
      </div>
      <div className="flex-1">
        <div className="text-[var(--ink-900)]">{label}</div>
        <div className="text-[11px] text-[var(--ink-500)]">{sub}</div>
      </div>
    </li>
  );
}
