import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { listAllSpendAnomalies } from "@/lib/spend-data";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatRelative } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";


export default async function SpendAnomaliesPage() {
  const anomalies = await listAllSpendAnomalies();

  return (
    <>
      <Topbar pageTitle="Spend anomalies" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
          <Link
            href="/spend"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All categories
          </Link>

          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">
              Spend anomalies — {anomalies.length}
            </h1>
            <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
              Category variance · unit-price drift · off-contract · split-purchase
            </p>
          </section>

          <section className="space-y-3">
            {anomalies.map((a) => {
              const conf = Math.max(1, Math.min(5, a.confidence)) as 1 | 2 | 3 | 4 | 5;
              const scripted = a.scriptedResponseKey ? SCRIPTED_RESPONSES[a.scriptedResponseKey] : undefined;
              return (
                <article
                  key={a.id}
                  className="flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)]"
                >
                  <span
                    className={
                      "mt-1 h-2 w-2 shrink-0 rounded-full " +
                      (a.severity === "CRITICAL" ? "bg-[var(--bad-dot)]" : a.severity === "HIGH" ? "bg-[var(--warn-dot)]" : a.severity === "MEDIUM" ? "bg-[var(--info-dot)]" : "bg-[var(--neutral-dot)]")
                    }
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={a.severity === "CRITICAL" ? "bad" : a.severity === "HIGH" ? "warn" : "info"} label={a.severity} />
                      <StatusPill tone={a.status === "OPEN" ? "info" : a.status === "ACKNOWLEDGED" ? "ok" : "neutral"} label={a.status} />
                      <h3 className="text-[14px] font-medium text-[var(--ink-900)]">{a.title}</h3>
                      <span className="ml-auto font-mono text-[11px] text-[var(--ink-500)]">{formatRelative(a.raisedAt)}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">{a.narrative}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {a.vendor && (
                        <Link
                          href={`/vendors/${a.vendor.code}`}
                          className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:text-[var(--navy-900)]"
                        >
                          {a.vendor.code}
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
                    citations={(scripted?.citations ?? []).map((c) => ({ label: c.label }))}
                    followUps={scripted?.followUps ?? []}
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
