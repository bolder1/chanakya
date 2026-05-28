import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { MoneyChart } from "@/components/charts/MoneyChart";
import { getVendorByCode } from "@/lib/vendors-data";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatInr, formatInrCompact, formatDate } from "@/lib/format";
import { ChevronLeft, Building2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ vendorId: string }>;
}

export default async function VendorDetailPage({ params }: Props) {
  const { vendorId } = await params;
  const data = await getVendorByCode(vendorId);
  if (!data) notFound();
  const { vendor, invoices, anomalies, spendAgg, timeline } = data;

  const chartPoints = timeline.map((t) => ({
    label: t.month,
    value: Number(t.paise),
  }));

  return (
    <>
      <Topbar pageTitle={`Vendor · ${vendor.code}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All vendors
          </Link>

          {/* Header */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-[var(--navy-50)]">
                <Building2 className="h-5 w-5 text-[var(--navy-700)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">{vendor.legalName}</h1>
                  <StatusPill
                    tone={vendor.status === "ACTIVE" ? "ok" : "neutral"}
                    label={vendor.status}
                  />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-500)]">
                  <span className="font-mono text-[var(--ink-700)]">{vendor.code}</span>
                  <span>·</span>
                  <span>{vendor.category}</span>
                  <span>·</span>
                  <span>GSTIN: <span className="font-mono text-[var(--ink-900)]">{vendor.gstin ?? "—"}</span></span>
                  <span>·</span>
                  <span>Terms: <span className="font-mono">Net {vendor.paymentTermsDays}</span></span>
                </div>
              </div>
              {anomalies.filter((a) => a.status === "OPEN").length > 0 && (
                <div className="rounded-md bg-[var(--warn-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--warn-fg)]">
                  {anomalies.filter((a) => a.status === "OPEN").length} open
                </div>
              )}
            </div>
          </section>

          {/* KPI strip */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Total spend" value={formatInrCompact(spendAgg._sum.totalPaise ?? 0n)} sub={formatInr(spendAgg._sum.totalPaise ?? 0n)} />
            <Tile label="Tax billed" value={formatInrCompact(spendAgg._sum.taxPaise ?? 0n)} />
            <Tile label="TDS deducted" value={formatInrCompact(spendAgg._sum.tdsPaise ?? 0n)} />
            <Tile label="Invoices" value={String(invoices.length)} />
          </section>

          {/* Spend chart */}
          {chartPoints.length > 0 && (
            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Monthly spend
              </h2>
              <div className="mt-4">
                <MoneyChart points={chartPoints} unit="PAISE" />
              </div>
            </section>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                Anomalies on this vendor ({anomalies.length})
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
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={a.severity === "CRITICAL" ? "bad" : a.severity === "HIGH" ? "warn" : "info"} label={a.severity} />
                          <StatusPill tone={a.status === "OPEN" ? "info" : a.status === "ACKNOWLEDGED" ? "ok" : "neutral"} label={a.status} />
                          <h3 className="text-[13px] font-medium text-[var(--ink-900)]">{a.title}</h3>
                          <span className="ml-auto font-mono text-[11px] text-[var(--ink-500)]">{a.kind}</span>
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

          {/* Invoice ledger */}
          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
              Invoice ledger ({invoices.length})
            </h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Invoice #</th>
                    <th className="px-4 py-2.5 text-left font-medium">Received</th>
                    <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tax</th>
                    <th className="px-4 py-2.5 text-right font-medium">TDS</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 50).map((inv) => (
                    <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--ink-900)]">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{formatDate(inv.receivedOn)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{formatInr(inv.subtotalPaise)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-500)]">{formatInr(inv.taxPaise)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-500)]">{formatInr(inv.tdsPaise)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">{formatInr(inv.totalPaise)}</td>
                      <td className="px-4 py-3"><StatusPill tone={inv.status === "PAID" ? "ok" : inv.status === "DISPUTED" ? "bad" : "info"} label={inv.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/vendors/${vendor.code}/invoices/${inv.id}`} className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length > 50 && (
                <div className="px-4 py-2 text-center text-[11px] text-[var(--ink-500)]">
                  Showing 50 of {invoices.length}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">{label}</div>
      <div className="mt-1 font-mono text-[24px] font-semibold tabular text-[var(--ink-900)]">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-[var(--ink-500)]">{sub}</div>}
    </div>
  );
}
