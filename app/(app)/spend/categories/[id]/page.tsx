import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { MoneyChart } from "@/components/charts/MoneyChart";
import { getCategoryDetail } from "@/lib/spend-data";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatInr, formatInrCompact, formatDate } from "@/lib/format";
import { ChevronLeft, ShoppingCart, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getCategoryDetail(id);
  if (!data) notFound();
  const { category, entries, vendorRows, monthlyTrend, unitPriceTrend, dominantDesc, anomalies } = data;

  const totalSpendLast12 = monthlyTrend.reduce((acc, p) => acc + p, 0n);

  return (
    <>
      <Topbar pageTitle={`Spend · ${category.name}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <Link
            href="/spend"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All categories
          </Link>

          {/* Header */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-[var(--navy-50)]">
                <ShoppingCart className="h-5 w-5 text-[var(--navy-700)]" />
              </div>
              <div className="flex-1">
                <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">{category.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-500)]">
                  <span>Owner: <span className="text-[var(--ink-900)]">{category.owner ?? "—"}</span></span>
                  <span>·</span>
                  <span>Monthly budget: <span className="font-mono text-[var(--ink-900)]">{formatInrCompact(category.monthlyBudgetPaise)}</span></span>
                  <span>·</span>
                  <span>12mo spend: <span className="font-mono text-[var(--ink-900)]">{formatInrCompact(totalSpendLast12)}</span></span>
                </div>
              </div>
            </div>
          </section>

          {/* Monthly trend */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">Monthly spend (last 12 months)</h2>
            <div className="mt-4">
              <MoneyChart
                points={monthlyTrend.map((p, i) => ({
                  label: monthLabel(i, monthlyTrend.length),
                  value: Number(p),
                  highlight: i === monthlyTrend.length - 1 && monthlyTrend[i]! > monthlyTrend[monthlyTrend.length - 2]! * 130n / 100n,
                }))}
                unit="PAISE"
              />
            </div>
          </section>

          {/* Unit price trend */}
          {unitPriceTrend.length > 0 && dominantDesc && (
            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Unit price — <span className="font-mono text-[var(--ink-700)]">{dominantDesc}</span>
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">Weekly average; saffron dot flags spikes &gt;30% above median</p>
              <div className="mt-3">
                <MoneyChart points={unitPriceTrend} unit="PAISE" height={180} />
              </div>
            </section>
          )}

          {/* Top vendors */}
          {vendorRows.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">Top vendors (12mo)</h2>
              <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium">Vendor</th>
                      <th className="px-4 py-2.5 text-right font-medium">12mo spend</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorRows.slice(0, 10).map((v) => (
                      <tr key={v.vendorId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                        <td className="px-4 py-3 font-mono text-[var(--ink-900)]">{v.code}</td>
                        <td className="px-4 py-3">{v.legalName}</td>
                        <td className="px-4 py-3 text-right font-mono tabular">{formatInr(v.totalPaise)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/vendors/${v.code}`} className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                Anomalies in this category
              </h2>
              <div className="mt-3 space-y-3">
                {anomalies.map((a) => {
                  const conf = Math.max(1, Math.min(5, a.confidence)) as 1 | 2 | 3 | 4 | 5;
                  const scripted = a.scriptedResponseKey ? SCRIPTED_RESPONSES[a.scriptedResponseKey] : undefined;
                  return (
                    <article key={a.id} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={a.severity === "CRITICAL" ? "bad" : a.severity === "HIGH" ? "warn" : "info"} label={a.severity} />
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

          {/* Recent entries */}
          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">Recent entries ({entries.length})</h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium">Description</th>
                    <th className="px-4 py-2.5 text-left font-medium">Vendor</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Unit price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 30).map((e) => (
                    <tr key={e.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--ink-500)]">{formatDate(e.occurredOn)}</td>
                      <td className="px-4 py-3 text-[var(--ink-900)]">{e.description}</td>
                      <td className="px-4 py-3">
                        {e.vendor ? (
                          <Link href={`/vendors/${e.vendor.code}`} className="font-mono text-[12px] text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                            {e.vendor.code}
                          </Link>
                        ) : (
                          <span className="text-[var(--ink-500)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular">{e.quantity} {e.unit.toLowerCase()}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-700)]">{formatInr(e.unitPricePaise)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">{formatInr(e.totalPaise)}</td>
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

function monthLabel(idx: number, total: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - (total - 1 - idx));
  return d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
}
