"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Download, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { lockCycleAndGenerate } from "@/lib/actions";
import { formatInr, formatInrCompact, formatCycle } from "@/lib/format";

interface Gate {
  cycleLabel: string;
  cycleState: "OPEN" | "LOCKED" | "CLOSED";
  employeeCount: number;
  totalGrossPaise: string; // serialized BigInt
  totalDeductionsPaise: string;
  totalNetPayPaise: string;
  totalReimbursementPaise: string;
  totalPayoutPaise: string;
  openAnomalies: number;
  acknowledgedAnomalies: number;
  dismissedAnomalies: number;
  lockedAtIso: string | null;
}

interface Props {
  gate: Gate;
  variant?: "primary" | "secondary";
  label?: string;
}

export function GenerateRegisterDrawer({ gate, variant = "primary", label }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ downloadUrl: string; employeeCount: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const lockedState = gate.cycleState !== "OPEN";

  const handleLock = () => {
    setError(null);
    if (confirmText !== "LOCK") {
      setError('Type "LOCK" exactly to proceed.');
      return;
    }
    startTransition(async () => {
      try {
        const r = await lockCycleAndGenerate(gate.cycleLabel, confirmText);
        setResult({ downloadUrl: r.downloadUrl, employeeCount: r.employeeCount });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const triggerLabel =
    label ?? (lockedState ? "Download register" : "Generate register");

  if (lockedState) {
    // Already locked — show a download button instead
    return (
      <a
        href={`/api/registers/${gate.cycleLabel}/export`}
        className={
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium " +
          (variant === "primary"
            ? "bg-[var(--navy-900)] text-white hover:bg-[var(--navy-800)]"
            : "border border-[var(--border)] bg-white text-[var(--ink-700)] hover:border-[var(--border-strong)]")
        }
      >
        <Download className="h-3.5 w-3.5" />
        {triggerLabel}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium " +
          (variant === "primary"
            ? "bg-[var(--navy-900)] text-white hover:bg-[var(--navy-800)]"
            : "border border-[var(--border)] bg-white text-[var(--ink-700)] hover:border-[var(--border-strong)]")
        }
      >
        <Lock className="h-3.5 w-3.5" />
        {triggerLabel}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => !pending && setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[460px] flex-col border-l border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
            <header className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
                <Lock className="h-4 w-4 text-[var(--navy-700)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  Critical action
                </div>
                <h3 className="mt-0.5 text-[16px] font-semibold text-[var(--ink-900)]">
                  Lock {formatCycle(gate.cycleLabel)} & generate register
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-500)] hover:bg-[var(--bg-surface-2)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {result ? (
                <div className="rounded-md border border-[var(--ok-border)] bg-[var(--ok-bg)] px-4 py-4 text-center">
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-[var(--ok-border)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--ok-fg)]" />
                  </div>
                  <h4 className="mt-3 text-[14px] font-semibold text-[var(--ok-fg)]">
                    Cycle locked
                  </h4>
                  <p className="mt-1 text-[12px] text-[var(--ink-700)]">
                    Register for {result.employeeCount} employees ready to download.
                  </p>
                  <a
                    href={result.downloadUrl}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </a>
                </div>
              ) : (
                <>
                  {/* Totals */}
                  <section>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                      What's about to be exported
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                      <Row label="Employees" value={String(gate.employeeCount)} />
                      <Row label="Period" value={formatCycle(gate.cycleLabel)} />
                      <Row label="GROSS" value={formatInr(BigInt(gate.totalGrossPaise))} />
                      <Row label="DEDUCTIONS" value={formatInr(BigInt(gate.totalDeductionsPaise))} />
                      <Row label="NET PAY" value={formatInr(BigInt(gate.totalNetPayPaise))} strong />
                      <Row label="REIMBURSEMENT" value={formatInr(BigInt(gate.totalReimbursementPaise))} />
                      <div className="col-span-2 my-1 border-t border-[var(--border)]" />
                      <Row label="Total payout" value={formatInr(BigInt(gate.totalPayoutPaise))} strong />
                      <Row label="In summaries" value={formatInrCompact(BigInt(gate.totalPayoutPaise))} />
                    </dl>
                  </section>

                  {/* Anomaly status */}
                  <section
                    className={
                      "rounded-md border px-3 py-2.5 " +
                      (gate.openAnomalies > 0
                        ? "border-[var(--warn-border)] bg-[var(--warn-bg)]"
                        : "border-[var(--ok-border)] bg-[var(--ok-bg)]")
                    }
                  >
                    <div className="flex items-start gap-2">
                      {gate.openAnomalies > 0 ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn-fg)]" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok-fg)]" />
                      )}
                      <div className="text-[12px]">
                        {gate.openAnomalies > 0 ? (
                          <>
                            <div className="font-medium text-[var(--warn-fg)]">
                              {gate.openAnomalies} anomalies still open
                            </div>
                            <div className="mt-0.5 text-[var(--ink-700)]">
                              You can lock anyway — open anomalies will be recorded in the
                              audit log as "open at lock". {gate.acknowledgedAnomalies}{" "}
                              acknowledged · {gate.dismissedAnomalies} dismissed so far.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-[var(--ok-fg)]">
                              All anomalies triaged
                            </div>
                            <div className="mt-0.5 text-[var(--ink-700)]">
                              {gate.acknowledgedAnomalies} acknowledged · {gate.dismissedAnomalies} dismissed
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Consequence */}
                  <div className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-[12px] text-[var(--ink-700)]">
                    <strong>The cycle becomes read-only.</strong> Existing runs are locked,
                    no more edits possible. The register is generated and ready to import
                    into Zoho Payroll. Any further adjustments will need a new CORRECTION
                    cycle.
                  </div>

                  {/* Type-to-confirm */}
                  <div>
                    <label className="block">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                        Type LOCK to confirm
                      </span>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="LOCK"
                        autoFocus
                        disabled={pending}
                        className="mt-1 block h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 font-mono text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:border-[var(--navy-700)] focus:outline-none"
                      />
                    </label>
                    {error && (
                      <div className="mt-2 rounded-md border border-[var(--bad-border)] bg-[var(--bad-bg)] px-3 py-2 text-[12px] text-[var(--bad-fg)]">
                        {error}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {!result && (
              <footer className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLock}
                  disabled={pending || confirmText !== "LOCK"}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-40"
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Lock className="h-3.5 w-3.5" />
                  {pending ? "Locking…" : "Lock & generate"}
                </button>
              </footer>
            )}
            {result && (
              <footer className="flex items-center justify-end border-t border-[var(--border)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
                >
                  Done
                </button>
              </footer>
            )}
          </aside>
        </>
      )}
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <>
      <dt className={"text-[var(--ink-500)] " + (strong ? "font-medium text-[var(--ink-900)]" : "")}>
        {label}
      </dt>
      <dd className={"text-right font-mono tabular " + (strong ? "font-semibold text-[var(--ink-900)]" : "text-[var(--ink-700)]")}>
        {value}
      </dd>
    </>
  );
}
