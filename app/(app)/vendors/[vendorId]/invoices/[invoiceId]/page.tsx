import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { AnomalyExplainDrawer } from "@/components/anomaly/AnomalyExplainDrawer";
import { getInvoiceById } from "@/lib/vendors-data";
import { SCRIPTED_RESPONSES } from "@/lib/ai/responses";
import { formatInr, formatDate } from "@/lib/format";
import { ChevronLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";


interface Props {
  params: Promise<{ vendorId: string; invoiceId: string }>;
}

export default async function InvoiceViewerPage({ params }: Props) {
  const { vendorId, invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice || invoice.vendor.code !== vendorId) notFound();

  // Reconciliation: sum of lines vs header subtotal
  const linesSum = invoice.lines.reduce((acc, l) => acc + l.totalPaise, 0n);
  const headerSubtotal = invoice.subtotalPaise;
  const gap = headerSubtotal - linesSum;
  const hasGap = gap !== 0n;

  // PO comparison if PO available
  const poLinesMissingOnInvoice = invoice.po
    ? invoice.po.lines.filter((pl) => !invoice.lines.some((il) => il.description === pl.description))
    : [];

  return (
    <>
      <Topbar pageTitle={`Invoice · ${invoice.invoiceNumber}`} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <Link
            href={`/vendors/${invoice.vendor.code}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {invoice.vendor.legalName}
          </Link>

          {/* Header */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-[var(--navy-50)]">
                <FileText className="h-5 w-5 text-[var(--navy-700)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-mono text-[20px] font-semibold text-[var(--ink-900)]">
                    {invoice.invoiceNumber}
                  </h1>
                  <StatusPill
                    tone={
                      invoice.status === "PAID" ? "ok" :
                        invoice.status === "DISPUTED" ? "bad" :
                          invoice.status === "APPROVED" ? "info" : "neutral"
                    }
                    label={invoice.status}
                  />
                  <StatusPill tone="neutral" label={`Source: ${invoice.source}`} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-500)]">
                  <span>From: <span className="text-[var(--ink-900)]">{invoice.vendor.legalName}</span></span>
                  <span>·</span>
                  <span>Issued: <span className="font-mono">{formatDate(invoice.issuedOn)}</span></span>
                  <span>·</span>
                  <span>Received: <span className="font-mono">{formatDate(invoice.receivedOn)}</span></span>
                  {invoice.dueOn && <>
                    <span>·</span>
                    <span>Due: <span className="font-mono">{formatDate(invoice.dueOn)}</span></span>
                  </>}
                  {invoice.po && <>
                    <span>·</span>
                    <span>Linked PO: <span className="font-mono text-[var(--ink-900)]">{invoice.po.poNumber}</span></span>
                  </>}
                </div>
              </div>
            </div>
          </section>

          {/* Reconciliation panel — this is Scenario 2's centerpiece */}
          <section
            className={
              "rounded-[var(--radius-card)] border bg-white p-5 shadow-[var(--shadow-card)] " +
              (hasGap
                ? "border-[var(--warn-border)] bg-[var(--warn-bg)]/30"
                : "border-[var(--ok-border)] bg-[var(--ok-bg)]/30")
            }
          >
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
              {hasGap ? (
                <AlertTriangle className="h-4 w-4 text-[var(--warn-fg)]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[var(--ok-fg)]" />
              )}
              Header vs lines reconciliation
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ReconRow label="Header subtotal" paise={headerSubtotal} />
              <ReconRow label="Sum of line items" paise={linesSum} />
              <ReconRow
                label="Gap"
                paise={gap}
                tone={hasGap ? (gap > 0n ? "warn" : "bad") : "ok"}
                noteWhenZero="Lines match header"
              />
            </div>
            {hasGap && poLinesMissingOnInvoice.length > 0 && (
              <div className="mt-4 rounded-md border border-[var(--warn-border)] bg-white px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--warn-fg)]">
                  Likely missing line(s) — present on PO but not on invoice
                </div>
                <ul className="mt-2 space-y-1 text-[12px]">
                  {poLinesMissingOnInvoice.map((pl) => (
                    <li key={pl.id} className="flex items-center justify-between">
                      <span className="text-[var(--ink-900)]">{pl.description}</span>
                      <span className="font-mono tabular text-[var(--warn-fg)]">
                        {formatInr(pl.totalPaise)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Anomalies on this invoice */}
          {invoice.anomalies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                Anomalies on this invoice
              </h2>
              <div className="mt-3 space-y-3">
                {invoice.anomalies.map((a) => {
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

          {/* Lines table */}
          <section>
            <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
              Line items ({invoice.lines.length})
            </h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">#</th>
                    <th className="px-4 py-2.5 text-left font-medium">Description</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Unit price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tax %</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-500)]">{l.lineNo}</td>
                      <td className="px-4 py-3 text-[var(--ink-900)]">{l.description}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{l.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-700)]">{formatInr(l.unitPricePaise)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-500)]">{l.taxPct}%</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">{formatInr(l.totalPaise)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--bg-surface-2)]">
                    <td colSpan={5} className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">Subtotal</td>
                    <td className="px-4 py-3 text-right font-mono tabular font-semibold text-[var(--ink-900)]">{formatInr(linesSum)}</td>
                  </tr>
                  <tr className="bg-[var(--bg-surface-2)]">
                    <td colSpan={5} className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">Tax</td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-700)]">{formatInr(invoice.taxPaise)}</td>
                  </tr>
                  {invoice.tdsPaise > 0n && (
                    <tr className="bg-[var(--bg-surface-2)]">
                      <td colSpan={5} className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">TDS</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-700)]">{formatInr(invoice.tdsPaise)}</td>
                    </tr>
                  )}
                  <tr className="bg-[var(--navy-50)]">
                    <td colSpan={5} className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-900)]">Total</td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[16px] font-semibold text-[var(--ink-900)]">{formatInr(invoice.totalPaise)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* PO comparison */}
          {invoice.po && (
            <section>
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Linked PO {invoice.po.poNumber} ({invoice.po.lines.length} lines)
              </h2>
              <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">#</th>
                      <th className="px-4 py-2.5 text-left font-medium">Description</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total</th>
                      <th className="px-4 py-2.5 text-right font-medium">On invoice?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.po.lines.map((pl) => {
                      const matched = invoice.lines.some((il) => il.description === pl.description);
                      return (
                        <tr key={pl.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-500)]">{pl.lineNo}</td>
                          <td className="px-4 py-3 text-[var(--ink-900)]">{pl.description}</td>
                          <td className="px-4 py-3 text-right font-mono tabular">{formatInr(pl.totalPaise)}</td>
                          <td className="px-4 py-3 text-right">
                            <StatusPill tone={matched ? "ok" : "warn"} label={matched ? "Matched" : "Missing"} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function ReconRow({
  label,
  paise,
  tone = "neutral",
  noteWhenZero,
}: {
  label: string;
  paise: bigint;
  tone?: "ok" | "warn" | "bad" | "neutral";
  noteWhenZero?: string;
}) {
  const isZero = paise === 0n;
  const toneClass =
    tone === "warn" ? "text-[var(--warn-fg)]" :
      tone === "bad" ? "text-[var(--bad-fg)]" :
        tone === "ok" ? "text-[var(--ok-fg)]" :
          "text-[var(--ink-900)]";
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">{label}</div>
      <div className={"mt-1 font-mono text-[20px] font-semibold tabular " + toneClass}>
        {isZero && noteWhenZero ? "₹0" : formatInr(paise)}
      </div>
      {isZero && noteWhenZero && (
        <div className="mt-0.5 text-[11px] text-[var(--ok-fg)]">{noteWhenZero}</div>
      )}
    </div>
  );
}
