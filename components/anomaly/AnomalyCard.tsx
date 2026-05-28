import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status/StatusPill";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const sevTone: Record<Severity, "neutral" | "info" | "warn" | "bad"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warn",
  CRITICAL: "bad",
};

interface AnomalyCardProps {
  id: string;
  severity: Severity;
  title: string;
  narrative: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  citations?: { label: string; href?: string }[];
  href?: string;
  raisedAt?: string;
}

export function AnomalyCard({
  severity,
  title,
  narrative,
  confidence,
  citations = [],
  href,
  raisedAt,
}: AnomalyCardProps) {
  return (
    <article className="group flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
      <span
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-full",
          severity === "CRITICAL" && "bg-[var(--bad-dot)]",
          severity === "HIGH" && "bg-[var(--warn-dot)]",
          severity === "MEDIUM" && "bg-[var(--info-dot)]",
          severity === "LOW" && "bg-[var(--neutral-dot)]",
        )}
      />

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={sevTone[severity]} label={severity} />
          <h3 className="text-[14px] font-medium text-[var(--ink-900)]">{title}</h3>
          {raisedAt && (
            <span className="ml-auto font-mono text-[11px] text-[var(--ink-500)]">
              {raisedAt}
            </span>
          )}
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">
          {narrative}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {citations.map((c, i) =>
            c.href ? (
              <Link
                key={`${c.label}-${i}`}
                href={c.href}
                className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:text-[var(--navy-900)]"
              >
                {c.label}
              </Link>
            ) : (
              <span
                key={`${c.label}-${i}`}
                className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)]"
              >
                {c.label}
              </span>
            ),
          )}
          <ConfidenceMeter level={confidence} />
        </div>
      </div>

      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 self-center rounded-md border border-transparent bg-[var(--saffron-50)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-900)] hover:border-[var(--saffron-300)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
          Explain
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </article>
  );
}

function ConfidenceMeter({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span
      className="ml-auto inline-flex items-center gap-0.5"
      aria-label={`Confidence ${level} of 5`}
      title={`Confidence ${level}/5`}
    >
      <span className="mr-1 text-[10px] text-[var(--ink-500)]">conf</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-1 rounded-sm",
            i < level ? "bg-[var(--navy-700)]" : "bg-[var(--border)]",
          )}
        />
      ))}
    </span>
  );
}
