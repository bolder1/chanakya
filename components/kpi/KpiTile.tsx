import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string;
  deltaPct?: number;
  deltaLabel?: string;
  sparkline?: number[];
  accent?: boolean;
}

export function KpiTile({
  label,
  value,
  deltaPct,
  deltaLabel,
  sparkline,
  accent,
}: KpiTileProps) {
  const trendUp = (deltaPct ?? 0) > 0;
  const trendDown = (deltaPct ?? 0) < 0;
  const TrendIcon = trendUp ? ArrowUp : trendDown ? ArrowDown : Minus;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]",
        accent && "ring-1 ring-[var(--saffron-300)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
          {label}
        </span>
        {deltaPct !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium font-mono",
              trendUp && "bg-[var(--ok-bg)] text-[var(--ok-fg)]",
              trendDown && "bg-[var(--bad-bg)] text-[var(--bad-fg)]",
              !trendUp && !trendDown && "bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
            )}
          >
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="font-mono text-[28px] font-semibold leading-none tracking-tight text-[var(--ink-900)] tabular">
        {value}
      </div>

      {(deltaLabel || sparkline) && (
        <div className="flex items-end justify-between gap-3">
          {deltaLabel && (
            <span className="text-[11px] text-[var(--ink-500)]">{deltaLabel}</span>
          )}
          {sparkline && sparkline.length > 0 && <Sparkline points={sparkline} />}
        </div>
      )}
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const w = 88;
  const h = 24;
  const step = w / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="text-[var(--navy-600)]"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
