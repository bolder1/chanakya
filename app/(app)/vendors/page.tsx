import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { listVendorsWithRollup } from "@/lib/vendors-data";
import { formatInrCompact } from "@/lib/format";
import { ChevronRight, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";


const CATEGORY_LABEL: Record<string, string> = {
  HARDWARE: "Hardware",
  SAAS: "SaaS",
  PROFESSIONAL: "Professional",
  FACILITY: "Facility",
  FOOD: "Food",
  TRAVEL: "Travel",
  MARKETING: "Marketing",
  LOGISTICS: "Logistics",
  OTHER: "Other",
};

export default async function VendorsPage() {
  const vendors = await listVendorsWithRollup();
  const grouped = vendors.reduce<Record<string, typeof vendors>>((acc, v) => {
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  const totalSpend = vendors.reduce((acc, v) => acc + v.ytdSpendPaise, 0n);
  const totalAnomalies = vendors.reduce((acc, v) => acc + v.openAnomalyCount, 0);

  return (
    <>
      <Topbar pageTitle="Vendors" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {/* Header summary */}
          <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--navy-50)]">
                <Building2 className="h-4 w-4 text-[var(--navy-700)]" />
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  Vendors
                </div>
                <div className="font-mono text-[20px] font-semibold text-[var(--ink-900)]">
                  {vendors.length}
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <Stat label="YTD spend" value={formatInrCompact(totalSpend)} mono />
            <Stat
              label="Open anomalies"
              value={String(totalAnomalies)}
              mono
              accent={totalAnomalies > 0}
            />
            <Link
              href="/vendors/anomalies"
              className="ml-auto rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
            >
              View anomalies →
            </Link>
          </section>

          {/* Grouped by category */}
          {Object.entries(grouped).map(([category, list]) => (
            <section key={category}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                  {CATEGORY_LABEL[category] ?? category}
                </h2>
                <span className="text-[12px] text-[var(--ink-500)]">{list.length} vendors</span>
              </div>
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium">Legal name</th>
                      <th className="px-4 py-2.5 text-left font-medium">GSTIN</th>
                      <th className="px-4 py-2.5 text-right font-medium">Invoices</th>
                      <th className="px-4 py-2.5 text-right font-medium">YTD spend</th>
                      <th className="px-4 py-2.5 text-right font-medium">Open</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]"
                      >
                        <td className="px-4 py-3 font-mono text-[var(--ink-900)]">{v.code}</td>
                        <td className="px-4 py-3 text-[var(--ink-900)]">{v.legalName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-500)]">
                          {v.gstin ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular">{v.invoiceCount}</td>
                        <td className="px-4 py-3 text-right font-mono tabular text-[var(--ink-900)]">
                          {formatInrCompact(v.ytdSpendPaise)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular">
                          {v.openAnomalyCount > 0 ? (
                            <span className="text-[var(--warn-fg)]">{v.openAnomalyCount}</span>
                          ) : (
                            <span className="text-[var(--ink-400)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/vendors/${v.code}`}
                            className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                          >
                            Detail
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
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
