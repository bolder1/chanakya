import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "bad" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  ok: "bg-[var(--ok-bg)] text-[var(--ok-fg)] border-[var(--ok-border)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn-fg)] border-[var(--warn-border)]",
  bad: "bg-[var(--bad-bg)] text-[var(--bad-fg)] border-[var(--bad-border)]",
  info: "bg-[var(--info-bg)] text-[var(--info-fg)] border-[var(--info-border)]",
  neutral:
    "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] border-[var(--neutral-border)]",
};

const dotClasses: Record<Tone, string> = {
  ok: "bg-[var(--ok-dot)]",
  warn: "bg-[var(--warn-dot)]",
  bad: "bg-[var(--bad-dot)]",
  info: "bg-[var(--info-dot)]",
  neutral: "bg-[var(--neutral-dot)]",
};

interface StatusPillProps {
  tone: Tone;
  label: string;
  className?: string;
}

export function StatusPill({ tone, label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} />
      {label}
    </span>
  );
}
