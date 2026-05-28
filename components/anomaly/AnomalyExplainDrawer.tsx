"use client";

import { useState, useTransition } from "react";
import { Sparkles, X, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status/StatusPill";
import { acknowledgeAnomaly, dismissAnomaly, reopenAnomaly } from "@/lib/actions";

interface Citation {
  label: string;
  href?: string;
}

interface AnomalyExplainDrawerProps {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED";
  title: string;
  narrative: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  citations: Citation[];
  followUps?: string[];
  triggerLabel?: string;
}

const sevTone: Record<
  AnomalyExplainDrawerProps["severity"],
  "neutral" | "info" | "warn" | "bad"
> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warn",
  CRITICAL: "bad",
};

export function AnomalyExplainDrawer({
  id,
  severity,
  status,
  title,
  narrative,
  confidence,
  citations,
  followUps = [],
  triggerLabel = "Explain",
}: AnomalyExplainDrawerProps) {
  const [open, setOpen] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const handleAck = () => {
    startTransition(async () => {
      await acknowledgeAnomaly(id);
      setOpen(false);
    });
  };

  const handleDismiss = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      await dismissAnomaly(id, reason);
      setOpen(false);
      setShowDismiss(false);
      setReason("");
    });
  };

  const handleReopen = () => {
    startTransition(async () => {
      await reopenAnomaly(id);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-transparent bg-[var(--saffron-50)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-900)] hover:border-[var(--saffron-300)]"
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
        {triggerLabel}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[420px] flex-col border-l border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
            <header className="flex items-start gap-3 border-b border-[var(--border)] bg-[var(--saffron-50)] px-5 py-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white ring-1 ring-[var(--saffron-300)]">
                <Sparkles className="h-4 w-4 text-[var(--saffron-500)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  AI explanation
                </div>
                <h3 className="mt-0.5 text-[14px] font-semibold text-[var(--ink-900)]">
                  {title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <StatusPill tone={sevTone[severity]} label={severity} />
                  <StatusPill
                    tone={
                      status === "OPEN"
                        ? "info"
                        : status === "ACKNOWLEDGED"
                          ? "ok"
                          : status === "DISMISSED"
                            ? "neutral"
                            : "ok"
                    }
                    label={status}
                  />
                  <ConfidenceMeter level={confidence} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-500)] hover:bg-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">
                {narrative}
              </p>

              {citations.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                    Citations
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {citations.map((c, i) =>
                      c.href ? (
                        <a
                          key={`${c.label}-${i}`}
                          href={c.href}
                          className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:text-[var(--navy-900)]"
                        >
                          {c.label}
                        </a>
                      ) : (
                        <span
                          key={`${c.label}-${i}`}
                          className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)]"
                        >
                          {c.label}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {followUps.length > 0 && (
                <div className="mt-5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                    Suggested actions
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {followUps.map((q) => (
                      <button
                        key={q}
                        className="block w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-left text-[12px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:bg-[var(--bg-surface-2)]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-[var(--border)] px-5 py-3">
              {status === "OPEN" && !showDismiss && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAck}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDismiss(true)}
                    disabled={pending}
                    className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)] disabled:opacity-50"
                  >
                    Dismiss with reason
                  </button>
                </div>
              )}

              {status === "OPEN" && showDismiss && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for dismissal…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                    className="h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-[13px] focus:border-[var(--navy-700)]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDismiss(false);
                        setReason("");
                      }}
                      className="text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      disabled={pending || !reason.trim()}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium",
                        reason.trim()
                          ? "bg-[var(--bad-bg)] text-[var(--bad-fg)] hover:bg-[var(--bad-border)]"
                          : "bg-[var(--neutral-bg)] text-[var(--ink-400)]",
                      )}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              )}

              {(status === "ACKNOWLEDGED" || status === "DISMISSED") && (
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={pending}
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
                >
                  Reopen
                </button>
              )}
            </footer>
          </aside>
        </>
      )}
    </>
  );
}

function ConfidenceMeter({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="ml-auto inline-flex items-center gap-0.5" title={`Confidence ${level}/5`}>
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
