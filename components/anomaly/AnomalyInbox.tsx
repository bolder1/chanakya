"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare, Square, Sparkles, Download, AlertTriangle, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bulkAcknowledgeAnomalies,
  bulkDismissAnomalies,
} from "@/lib/actions";
import { StatusPill } from "@/components/status/StatusPill";
import { formatRelative } from "@/lib/format";

interface InboxRow {
  id: string;
  kind: string;
  scope: "payroll" | "vendor" | "spend" | "all";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED";
  confidence: number;
  title: string;
  summary: string;
  narrative: string;
  raisedAtIso: string;
  employee: { empId: string; name: string } | null;
  vendor: { code: string; legalName: string } | null;
  cycle: { label: string } | null;
  invoice: { id: string; invoiceNumber: string; vendorCode: string } | null;
}

interface Facets {
  cycleLabels: string[];
  kinds: string[];
}

interface AnomalyInboxProps {
  rows: InboxRow[];
  facets: Facets;
  initialFilters: {
    scope: string;
    status: string;
    severity: string;
    kind: string;
    cycleLabel: string;
  };
}

const SEVERITY_OPTIONS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUS_OPTIONS = ["ALL", "OPEN", "ACKNOWLEDGED", "DISMISSED", "RESOLVED"];
const SCOPE_OPTIONS = [
  { value: "all", label: "All scopes" },
  { value: "payroll", label: "Payroll" },
  { value: "vendor", label: "Vendor invoices" },
  { value: "spend", label: "External spend" },
];

export function AnomalyInbox({ rows, facets, initialFilters }: AnomalyInboxProps) {
  const router = useRouter();
  const search = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Eligible for bulk-ack: OPEN only; for bulk-dismiss: OPEN or ACKNOWLEDGED.
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const eligibleAck = selectedRows.filter((r) => r.status === "OPEN").length;
  const eligibleDismiss = selectedRows.filter((r) => r.status === "OPEN" || r.status === "ACKNOWLEDGED").length;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(search?.toString());
    if (value === "ALL" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/anomalies${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const toggleRow = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  const handleBulkAck = () => {
    if (eligibleAck === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const ids = selectedRows.filter((r) => r.status === "OPEN").map((r) => r.id);
        const r = await bulkAcknowledgeAnomalies(ids);
        setSelected(new Set());
        router.refresh();
        // Optional toast via a tiny inline message — we just refresh
        void r;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleBulkDismiss = () => {
    if (eligibleDismiss === 0 || !reason.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const ids = selectedRows
          .filter((r) => r.status === "OPEN" || r.status === "ACKNOWLEDGED")
          .map((r) => r.id);
        await bulkDismissAnomalies(ids, reason);
        setSelected(new Set());
        setConfirmingDismiss(false);
        setReason("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    return `/api/anomalies/export?${params.toString()}`;
  }, [search]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <section className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
        <FilterSelect
          label="Scope"
          value={initialFilters.scope}
          options={SCOPE_OPTIONS}
          onChange={(v) => updateFilter("scope", v)}
        />
        <FilterSelect
          label="Severity"
          value={initialFilters.severity}
          options={SEVERITY_OPTIONS.map((s) => ({ value: s, label: s }))}
          onChange={(v) => updateFilter("severity", v)}
        />
        <FilterSelect
          label="Status"
          value={initialFilters.status}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          onChange={(v) => updateFilter("status", v)}
        />
        <FilterSelect
          label="Cycle"
          value={initialFilters.cycleLabel}
          options={[{ value: "ALL", label: "All" }, ...facets.cycleLabels.map((l) => ({ value: l, label: l }))]}
          onChange={(v) => updateFilter("cycleLabel", v)}
        />
        <FilterSelect
          label="Kind"
          value={initialFilters.kind}
          options={[{ value: "ALL", label: "Any kind" }, ...facets.kinds.map((k) => ({ value: k, label: k }))]}
          onChange={(v) => updateFilter("kind", v)}
        />
        <div className="ml-auto flex items-center gap-2 text-[12px]">
          <span className="text-[var(--ink-500)]">{rows.length} matched</span>
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>
      </section>

      {/* Bulk action bar — visible when there's a selection */}
      {selected.size > 0 && (
        <section className="sticky top-0 z-10 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--saffron-300)] bg-[var(--saffron-50)] px-4 py-2.5 shadow-[var(--shadow-card)]">
          <span className="font-mono text-[12px] font-medium text-[var(--ink-900)]">
            {selected.size} selected
          </span>
          <span className="text-[11px] text-[var(--ink-500)]">
            ({eligibleAck} ack-eligible · {eligibleDismiss} dismiss-eligible)
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-[11px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            Clear
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkAck}
              disabled={pending || eligibleAck === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--navy-900)] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-40"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Acknowledge {eligibleAck}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDismiss(true)}
              disabled={pending || eligibleDismiss === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)] disabled:opacity-40"
            >
              <XCircle className="h-3 w-3" />
              Dismiss {eligibleDismiss}…
            </button>
          </div>
        </section>
      )}

      {confirmingDismiss && (
        <section className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--warn-fg)]" />
          <span className="text-[12px] text-[var(--warn-fg)]">
            Dismissing {eligibleDismiss}. Reason is required and recorded in audit:
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            placeholder="e.g. False positive — pre-approved by Finance"
            className="h-7 flex-1 rounded-md border border-[var(--border)] bg-white px-2 text-[12px]"
          />
          <button
            type="button"
            onClick={() => {
              setConfirmingDismiss(false);
              setReason("");
            }}
            className="text-[11px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBulkDismiss}
            disabled={pending || !reason.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bad-fg)] px-2.5 py-1 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Confirm dismiss
          </button>
        </section>
      )}

      {error && (
        <div className="rounded-md border border-[var(--bad-border)] bg-[var(--bad-bg)] px-3 py-2 text-[12px] text-[var(--bad-fg)]">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-[var(--ink-500)]">
            No anomalies match these filters. Try widening them.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
              <tr>
                <th className="w-10 px-4 py-2.5 text-left">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="grid h-4 w-4 place-items-center"
                    aria-label="Select all"
                  >
                    {selected.size === rows.length && rows.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[var(--navy-700)]" />
                    ) : (
                      <Square className="h-4 w-4 text-[var(--ink-400)]" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2.5 text-left font-medium">Severity</th>
                <th className="px-4 py-2.5 text-left font-medium">Scope</th>
                <th className="px-4 py-2.5 text-left font-medium">Title</th>
                <th className="px-4 py-2.5 text-left font-medium">Target</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Raised</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]",
                    selected.has(r.id) && "bg-[var(--saffron-50)]/30",
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRow(r.id)}
                      className="grid h-4 w-4 place-items-center"
                      aria-label={`Select ${r.title}`}
                    >
                      {selected.has(r.id) ? (
                        <CheckSquare className="h-4 w-4 text-[var(--navy-700)]" />
                      ) : (
                        <Square className="h-4 w-4 text-[var(--ink-400)]" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        r.severity === "CRITICAL" ? "bad" :
                          r.severity === "HIGH" ? "warn" :
                            r.severity === "MEDIUM" ? "info" : "neutral"
                      }
                      label={r.severity}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)]">
                      {r.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--ink-900)]">{r.title}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-500)]">
                      {r.kind}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {r.employee && (
                      <Link
                        href={`/payroll/employees/${r.employee.empId}`}
                        className="font-mono text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                      >
                        {r.employee.empId}
                      </Link>
                    )}
                    {r.vendor && (
                      <Link
                        href={`/vendors/${r.vendor.code}`}
                        className="font-mono text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                      >
                        {r.vendor.code}
                      </Link>
                    )}
                    {r.invoice && (
                      <>
                        {" · "}
                        <Link
                          href={`/vendors/${r.invoice.vendorCode}/invoices/${r.invoice.id}`}
                          className="font-mono text-[10px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                        >
                          {r.invoice.invoiceNumber}
                        </Link>
                      </>
                    )}
                    {!r.employee && !r.vendor && (
                      <span className="text-[var(--ink-400)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        r.status === "OPEN" ? "info" :
                          r.status === "ACKNOWLEDGED" ? "ok" :
                            r.status === "DISMISSED" ? "neutral" : "ok"
                      }
                      label={r.status}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-500)]">
                    {formatRelative(new Date(r.raisedAtIso))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-[var(--saffron-500)]" />
        <span className="text-[11px] text-[var(--ink-500)]">
          AI is advisory — every acknowledge / dismiss is audit-trailed.
        </span>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[12px]">
      <span className="text-[var(--ink-500)]">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12px] text-[var(--ink-900)] focus:border-[var(--navy-700)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
