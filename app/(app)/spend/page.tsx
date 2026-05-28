import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { listCategoryCards } from "@/lib/spend-data";
import { formatInrCompact, formatPct } from "@/lib/format";
import { ChevronRight, ArrowUp, ArrowDown, Minus, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";


export default async function SpendPage() {
  const cards = await listCategoryCards();
  const totalSpend = cards.reduce((acc, c) => acc + c.currentMonthSpendPaise, 0n);
  const totalBudget = cards.reduce((acc, c) => acc + c.monthlyBudgetPaise, 0n);
  const totalAnomalies = cards.reduce((acc, c) => acc + c.openAnomalyCount, 0);

  return (
    <>
      <Topbar pageTitle="Spend" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <Stat label="Categories" value={String(cards.length)} mono />
            <div className="h-10 w-px bg-[var(--border)]" />
            <Stat label="MTD spend" value={formatInrCompact(totalSpend)} mono />
            <Stat label="MTD budget" value={formatInrCompact(totalBudget)} mono />
            <Stat label="Open anomalies" value={String(totalAnomalies)} mono accent={totalAnomalies > 0} />
            <Link
              href="/spend/anomalies"
              className="ml-auto rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
            >
              View anomalies →
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => {
              const trendUp = c.variancePct > 0;
              const trendDown = c.variancePct < 0;
              const TrendIcon = trendUp ? ArrowUp : trendDown ? ArrowDown : Minus;
              const alert = Math.abs(c.variancePct) >= 30 || c.openAnomalyCount > 0;
              return (
                <Link
                  key={c.id}
                  href={`/spend/categories/${c.id}`}
                  className={
                    "block rounded-[var(--radius-card)] border bg-white p-5 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] " +
                    (alert ? "border-[var(--saffron-300)]" : "border-[var(--border)]")
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[var(--ink-900)]">{c.name}</h3>
                      <div className="mt-0.5 text-[11px] text-[var(--ink-500)]">{c.owner ?? "Unowned"}</div>
                    </div>
                    {c.openAnomalyCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warn-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--warn-fg)]">
                        <AlertTriangle className="h-3 w-3" />
                        {c.openAnomalyCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="font-mono text-[24px] font-semibold tabular text-[var(--ink-900)]">
                      {formatInrCompact(c.currentMonthSpendPaise)}
                    </div>
                    <span
                      className={
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium " +
                        (trendUp ? "bg-[var(--bad-bg)] text-[var(--bad-fg)]" :
                          trendDown ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" :
                            "bg-[var(--neutral-bg)] text-[var(--neutral-fg)]")
                      }
                    >
                      <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
                      {formatPct(c.variancePct)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--ink-500)]">
                    <span>Budget {formatInrCompact(c.monthlyBudgetPaise)}</span>
                    <span>6mo avg {formatInrCompact(c.trailing6mAvgPaise)}</span>
                  </div>

                  <Sparkline values={c.monthlyTrend.map(Number)} />
                </Link>
              );
            })}
          </section>
        </div>
      </main>
    </>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 280;
  const h = 36;
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="mt-4 w-full text-[var(--navy-600)]" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" height={36}>
      <polyline fill="none" stroke="currentColor" strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">{label}</div>
      <div className={(mono ? "font-mono tabular " : "") + "mt-0.5 text-[15px] font-semibold " + (accent ? "text-[var(--warn-fg)]" : "text-[var(--ink-900)]")}>
        {value}
      </div>
    </div>
  );
}
