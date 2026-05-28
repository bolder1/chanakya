import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { getCycleByLabel, listAnomalies, PAYROLL_ANOMALY_KINDS } from "@/lib/payroll";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatCycle, formatRelative } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ cycleId: string }>;
}

export default async function CycleAnomaliesPage({ params }: Props) {
  const { cycleId } = await params;
  const cycle = await getCycleByLabel(cycleId);
  if (!cycle) notFound();

  const anomalies = await listAnomalies({
    cycleLabel: cycle.label,
    kinds: PAYROLL_ANOMALY_KINDS,
  });

  const byStatus = {
    OPEN: anomalies.filter((a) => a.status === "OPEN").length,
    ACK: anomalies.filter((a) => a.status === "ACKNOWLEDGED").length,
    DISMISSED: anomalies.filter((a) => a.status === "DISMISSED").length,
  };

  return (
    <>
      <Topbar
        pageTitle={`Payroll · ${formatCycle(cycle.label)} · Anomalies`}
       
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
          <Link
            href={`/payroll/${cycle.label}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {formatCycle(cycle.label)}
          </Link>

          <section className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div>
              <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">
                Payroll anomalies — {formatCycle(cycle.label)}
              </h1>
              <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
                Detected across salary, attendance, shift, hostel, and statutory checks
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span>
                <span className="font-mono font-semibold text-[var(--ink-900)]">{byStatus.OPEN}</span>{" "}
                <span className="text-[var(--ink-500)]">open</span>
              </span>
              <span>
                <span className="font-mono font-semibold text-[var(--ok-fg)]">{byStatus.ACK}</span>{" "}
                <span className="text-[var(--ink-500)]">acknowledged</span>
              </span>
              <span>
                <span className="font-mono font-semibold text-[var(--ink-500)]">{byStatus.DISMISSED}</span>{" "}
                <span className="text-[var(--ink-500)]">dismissed</span>
              </span>
            </div>
          </section>

          <section className="space-y-3">
            {anomalies.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white p-8 text-center text-[13px] text-[var(--ink-500)]">
                No payroll anomalies in this cycle. The cycle is clean.
              </div>
            )}
            {anomalies.map((a) => {
              const scripted = a.scriptedResponseKey
                ? SCRIPTED_RESPONSES[a.scriptedResponseKey]
                : undefined;
              const citations = scripted?.citations ?? [];
              const followUps = scripted?.followUps ?? [];
              const conf = Math.max(1, Math.min(5, a.confidence)) as 1 | 2 | 3 | 4 | 5;

              return (
                <article
                  key={a.id}
                  className="flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]"
                >
                  <span
                    className={
                      "mt-1 h-2 w-2 shrink-0 rounded-full " +
                      (a.severity === "CRITICAL"
                        ? "bg-[var(--bad-dot)]"
                        : a.severity === "HIGH"
                          ? "bg-[var(--warn-dot)]"
                          : a.severity === "MEDIUM"
                            ? "bg-[var(--info-dot)]"
                            : "bg-[var(--neutral-dot)]")
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={
                          a.severity === "CRITICAL"
                            ? "bad"
                            : a.severity === "HIGH"
                              ? "warn"
                              : a.severity === "MEDIUM"
                                ? "info"
                                : "neutral"
                        }
                        label={a.severity}
                      />
                      <StatusPill
                        tone={
                          a.status === "OPEN"
                            ? "info"
                            : a.status === "ACKNOWLEDGED"
                              ? "ok"
                              : "neutral"
                        }
                        label={a.status}
                      />
                      <h3 className="text-[14px] font-medium text-[var(--ink-900)]">
                        {a.title}
                      </h3>
                      <span className="ml-auto font-mono text-[11px] text-[var(--ink-500)]">
                        {formatRelative(a.raisedAt)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">
                      {a.narrative}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {a.employee && (
                        <Link
                          href={`/payroll/employees/${a.employee.empId}`}
                          className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:text-[var(--navy-900)]"
                        >
                          {a.employee.empId}
                        </Link>
                      )}
                      <span className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)]">
                        {a.kind}
                      </span>
                    </div>
                  </div>
                  <AnomalyExplainDrawer
                    id={a.id}
                    severity={a.severity}
                    status={a.status}
                    title={a.title}
                    narrative={a.narrative}
                    confidence={conf}
                    citations={citations.map((c) => ({ label: c.label, href: c.type === "Employee" ? `/payroll/employees/${c.id}` : c.type === "Vendor" ? `/vendors/${c.id}` : undefined }))}
                    followUps={followUps}
                  />
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </>
  );
}
