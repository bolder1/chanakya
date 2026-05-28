import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { MoneyChart } from "@/components/charts/MoneyChart";
import { getEmployeeTimeline } from "@/lib/employees";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatInr, formatInrCompact, formatCycle, formatDate } from "@/lib/format";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ empId: string }>;
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { empId } = await params;
  const data = await getEmployeeTimeline(empId);
  if (!data) notFound();

  const { employee, timeline, latestLine, latestAtt, latestHostel, anomalies } = data;

  // Build chart points — REGULAR runs only; mark the most recent as highlight if any open anomaly references it
  const regularPoints = timeline.filter((t) => t.runType === "REGULAR");
  const flaggedCycles = new Set(
    anomalies
      .filter((a) => a.status === "OPEN")
      .map((a) => a.cycleId)
      .filter((c): c is string => !!c),
  );
  // For visual highlight, mark the latest run cycle if there are open anomalies on this employee
  const chartPoints = regularPoints.map((p) => ({
    label: formatCycle(p.cycleLabel),
    value: Number(p.netPaise),
    highlight:
      p === regularPoints[regularPoints.length - 1] && anomalies.some((a) => a.status === "OPEN"),
  }));

  return (
    <>
      <Topbar pageTitle={`Employee · ${employee.empId}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All cycles
          </Link>

          {/* Header */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-6">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--navy-700)] font-mono text-[18px] font-semibold text-white">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="flex-1">
                <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">{employee.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--ink-500)]">
                  <span className="font-mono text-[var(--ink-700)]">{employee.empId}</span>
                  {employee.externalId && (
                    <span className="font-mono text-[11px]">ext: {employee.externalId}</span>
                  )}
                  <span>·</span>
                  <span>{employee.designation}</span>
                  <span>·</span>
                  <span>{employee.department}</span>
                  <span>·</span>
                  <span>{employee.location}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
                  <StatusPill
                    tone={employee.active ? "ok" : "neutral"}
                    label={employee.active ? "ACTIVE" : "EXITED"}
                  />
                  <span className="text-[var(--ink-500)]">DOJ: <span className="font-mono text-[var(--ink-900)]">{formatDate(employee.doj)}</span></span>
                  {employee.lwd && (
                    <span className="text-[var(--ink-500)]">LWD: <span className="font-mono text-[var(--bad-fg)]">{formatDate(employee.lwd)}</span></span>
                  )}
                  <span className="text-[var(--ink-500)]">CTC (annual): <span className="font-mono text-[var(--ink-900)]">{formatInr(employee.ctcAnnualPaise)}</span></span>
                  <span className="text-[var(--ink-500)]">Basic: <span className="font-mono text-[var(--ink-900)]">{formatInr(employee.basicMonthlyPaise)}</span>/mo</span>
                </div>
              </div>
            </div>
          </section>

          {/* Chart */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Net pay — last {regularPoints.length} cycles
              </h2>
              <div className="text-[11px] text-[var(--ink-500)]">REGULAR runs only</div>
            </div>
            <div className="mt-4">
              {chartPoints.length > 0 ? (
                <MoneyChart points={chartPoints} unit="PAISE" />
              ) : (
                <div className="grid h-[220px] place-items-center text-[12px] text-[var(--ink-500)]">
                  No payroll history.
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Latest salary */}
            <div className="lg:col-span-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Latest salary line
                {latestLine && (
                  <span className="ml-2 font-mono text-[11px] font-normal text-[var(--ink-500)]">
                    {formatCycle((timeline.find((t) => t.runType === "REGULAR" && t === timeline[timeline.length - 1])?.cycleLabel) ?? regularPoints[regularPoints.length - 1]?.cycleLabel ?? "")}
                  </span>
                )}
              </h3>
              {latestLine ? (
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                  <Row label="BASIC" value={formatInr(latestLine.basicPaise)} />
                  <Row label="HRA" value={formatInr(latestLine.hraPaise)} />
                  <Row label="CONVEYANCE ALLOWANCE" value={formatInr(latestLine.conveyanceAllowPaise)} />
                  <Row label="OTHER ALLOWANCE" value={formatInr(latestLine.otherAllowPaise)} />
                  <Row label="OTHER EARNINGS" value={formatInr(latestLine.otherEarningsPaise)} />
                  <Row label="SHIFT ALLOWANCE" value={formatInr(latestLine.shiftAllowPaise)} />
                  <Row label="BONUS" value={formatInr(latestLine.bonusPaise)} />
                  <Row label="GROSS" value={formatInr(latestLine.grossPaise)} strong />
                  <div className="col-span-2 my-2 border-t border-[var(--border)]" />
                  <Row label="Provident Fund" value={formatInr(latestLine.pfPaise)} />
                  <Row label="PROF TAX" value={formatInr(latestLine.ptPaise)} />
                  <Row label="INCOME TAX" value={formatInr(latestLine.incomeTaxPaise)} />
                  <Row label="LOAN DEDUCTION" value={formatInr(latestLine.loanDeductionPaise)} />
                  <Row label="GUEST HOUSE/OTHER" value={formatInr(latestLine.guesthouseDedPaise)} />
                  <Row label="INSURANCE DEDUCTION" value={formatInr(latestLine.insuranceDedPaise)} />
                  <Row label="RECOVERY" value={formatInr(latestLine.recoveryPaise)} />
                  <Row label="TOTAL DEDUCTIONS" value={formatInr(latestLine.totalDeductionsPaise)} strong />
                  <div className="col-span-2 my-2 border-t border-[var(--border)]" />
                  <Row label="NET PAY" value={formatInr(latestLine.netPayPaise)} strong />
                  <Row label="REIMBURSEMENT" value={formatInr(latestLine.reimbursementPaise)} />
                  <div className="col-span-2 my-1 border-t border-[var(--border)]" />
                  <Row label="Total Pay" value={formatInr(latestLine.totalPayPaise)} strong />
                  <Row label="DEPOSIT" value={latestLine.depositStatus} />
                </dl>
              ) : (
                <p className="mt-3 text-[12px] text-[var(--ink-500)]">No salary lines.</p>
              )}
            </div>

            {/* Right rail */}
            <aside className="space-y-4">
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <h3 className="text-[13px] font-semibold text-[var(--ink-900)]">
                  Latest attendance
                </h3>
                {latestAtt ? (
                  <ul className="mt-3 space-y-1.5 text-[12px]">
                    <li className="flex justify-between"><span className="text-[var(--ink-500)]">TOTAL DAYS</span><span className="font-mono">{latestAtt.totalDaysInMonth}</span></li>
                    <li className="flex justify-between"><span className="text-[var(--ink-500)]">PRESENT DAYS</span><span className="font-mono">{latestAtt.presentDays}</span></li>
                    <li className="flex justify-between"><span className="text-[var(--ink-500)]">Leaves taken</span><span className="font-mono">{latestAtt.totalLeavesTaken}</span></li>
                    <li className="flex justify-between"><span className="text-[var(--ink-500)]">LWP</span><span className={"font-mono " + (latestAtt.lwpDays > 0 ? "text-[var(--warn-fg)]" : "")}>{latestAtt.lwpDays}</span></li>
                    {latestAtt.dojThisMonth && (<li className="flex justify-between"><span className="text-[var(--ink-500)]">DOJ this month</span><span className="font-mono">{formatDate(latestAtt.dojThisMonth)}</span></li>)}
                    {latestAtt.lwdThisMonth && (<li className="flex justify-between"><span className="text-[var(--ink-500)]">LWD this month</span><span className="font-mono text-[var(--bad-fg)]">{formatDate(latestAtt.lwdThisMonth)}</span></li>)}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-[var(--ink-500)]">No attendance row.</p>
                )}
              </div>

              {latestHostel && (
                <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
                  <h3 className="text-[13px] font-semibold text-[var(--ink-900)]">
                    Hostel
                    <span className="ml-2 font-mono text-[11px] font-normal text-[var(--ink-500)]">
                      {latestHostel.guestHouse} · Flat {latestHostel.flatNo}
                    </span>
                  </h3>
                  <ul className="mt-3 space-y-1 text-[12px]">
                    <Row label="Accommodation" value={formatInr(latestHostel.accommodationPaise)} compact />
                    <Row label="Maintenance" value={formatInr(latestHostel.maintenancePaise)} compact />
                    <Row label="Food" value={formatInr(latestHostel.foodPaise)} compact />
                    <Row label="Transport" value={formatInr(latestHostel.transportPaise)} compact />
                    <Row label="Electricity" value={formatInr(latestHostel.electricityPaise)} compact />
                    <Row label="Internet" value={formatInr(latestHostel.internetPaise)} compact />
                    <div className="my-1 border-t border-[var(--border)]" />
                    <Row label="TOTAL" value={formatInr(latestHostel.totalPaise)} compact strong />
                  </ul>
                </div>
              )}
            </aside>
          </section>

          {/* Anomalies on this employee */}
          {anomalies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                Anomalies on {employee.empId} ({anomalies.length})
              </h2>
              <div className="mt-3 space-y-3">
                {anomalies.map((a) => {
                  const conf = Math.max(1, Math.min(5, a.confidence)) as 1 | 2 | 3 | 4 | 5;
                  const scripted = a.scriptedResponseKey ? SCRIPTED_RESPONSES[a.scriptedResponseKey] : undefined;
                  return (
                    <article
                      key={a.id}
                      className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]"
                    >
                      <span
                        className={
                          "mt-1 h-2 w-2 shrink-0 rounded-full " +
                          (a.severity === "CRITICAL" ? "bg-[var(--bad-dot)]" : a.severity === "HIGH" ? "bg-[var(--warn-dot)]" : a.severity === "MEDIUM" ? "bg-[var(--info-dot)]" : "bg-[var(--neutral-dot)]")
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={a.severity === "CRITICAL" ? "bad" : a.severity === "HIGH" ? "warn" : "info"} label={a.severity} />
                          <StatusPill tone={a.status === "OPEN" ? "info" : a.status === "ACKNOWLEDGED" ? "ok" : "neutral"} label={a.status} />
                          <h3 className="text-[13px] font-medium text-[var(--ink-900)]">{a.title}</h3>
                        </div>
                        <p className="text-[12px] text-[var(--ink-700)]">{a.narrative}</p>
                      </div>
                      <AnomalyExplainDrawer
                        id={a.id}
                        severity={a.severity}
                        status={a.status}
                        title={a.title}
                        narrative={a.narrative}
                        confidence={conf}
                        citations={(scripted?.citations ?? []).map((c) => ({ label: c.label }))}
                        followUps={scripted?.followUps ?? []}
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function Row({ label, value, strong, compact }: { label: string; value: string; strong?: boolean; compact?: boolean }) {
  return (
    <div className={"flex items-center justify-between " + (compact ? "text-[11px]" : "")}>
      <span className={"text-[var(--ink-500)] " + (strong ? "font-medium text-[var(--ink-900)]" : "")}>{label}</span>
      <span className={"font-mono " + (strong ? "font-semibold text-[var(--ink-900)]" : "text-[var(--ink-700)]")}>
        {value}
      </span>
    </div>
  );
}
