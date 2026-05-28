"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail, Paperclip, Sparkles, CheckCircle2, FileText, ExternalLink, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processEmailInvoice } from "@/lib/actions";
import { StatusPill } from "@/components/status/StatusPill";
import { formatInr, formatRelative, formatDateTime } from "@/lib/format";

interface SerializedEmail {
  id: string;
  from: string;
  fromName: string;
  vendorCode: string;
  subject: string;
  receivedAtIso: string;
  body: string;
  attachmentName: string;
  attachmentSizeKb: number;
  parsed: {
    invoiceNumber: string;
    issuedOnIso: string;
    subtotalPaise: string;
    taxPaise: string;
    totalPaise: string;
    confidence: 1 | 2 | 3 | 4 | 5;
    lines: Array<{
      description: string;
      quantity: number;
      unitPricePaise: string;
      taxPct: number;
      totalPaise: string;
    }>;
  };
  processed: boolean;
  createdInvoiceId: string | null;
  createdInvoiceVendorCode: string | null;
}

interface EmailInboxProps {
  emails: SerializedEmail[];
}

export function EmailInbox({ emails }: EmailInboxProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(emails[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = emails.find((e) => e.id === selectedId);
  const unprocessedCount = emails.filter((e) => !e.processed).length;

  const handleProcess = (emailId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await processEmailInvoice(emailId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
      {/* Left: email list */}
      <aside className="flex w-[400px] shrink-0 flex-col border-r border-[var(--border)]">
        <header className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2.5">
          <Mail className="h-3.5 w-3.5 text-[var(--ink-500)]" />
          <span className="text-[12px] font-medium text-[var(--ink-900)]">
            Inbox
          </span>
          <span className="ml-auto text-[11px] text-[var(--ink-500)]">
            {unprocessedCount} unprocessed · {emails.length} total
          </span>
        </header>
        <div className="flex-1 overflow-y-auto">
          {emails.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelectedId(e.id)}
              className={cn(
                "block w-full border-b border-[var(--border)] px-4 py-3 text-left transition-colors last:border-0",
                selectedId === e.id
                  ? "bg-[var(--saffron-50)]/40"
                  : "hover:bg-[var(--bg-surface-2)]",
                e.processed && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium text-[var(--ink-900)]">
                      {e.fromName}
                    </span>
                    {!e.processed && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--info-dot)]" />
                    )}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--ink-500)]">
                    {e.from}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-[var(--ink-500)]">
                  {formatRelative(new Date(e.receivedAtIso))}
                </span>
              </div>
              <div className={cn("mt-1.5 line-clamp-2 text-[12px]", e.processed ? "text-[var(--ink-500)]" : "text-[var(--ink-700)]")}>
                {e.subject}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1 py-0 font-mono text-[var(--ink-500)]">
                  <Paperclip className="h-2.5 w-2.5" />
                  {e.attachmentName.length > 18 ? e.attachmentName.slice(0, 18) + "…" : e.attachmentName}
                </span>
                {e.processed ? (
                  <span className="inline-flex items-center gap-1 rounded border border-[var(--ok-border)] bg-[var(--ok-bg)] px-1 py-0 text-[var(--ok-fg)]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Processed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded border border-[var(--saffron-300)] bg-[var(--saffron-50)] px-1 py-0 font-mono text-[var(--saffron-500)]">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI parsed
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Right: detail */}
      <section className="flex-1 overflow-y-auto">
        {selected ? (
          <article className="p-6">
            <header className="border-b border-[var(--border)] pb-4">
              <h2 className="text-[16px] font-semibold text-[var(--ink-900)]">
                {selected.subject}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-500)]">
                <div>
                  <span className="text-[var(--ink-700)]">{selected.fromName}</span>
                  <span className="ml-1.5 font-mono text-[11px]">&lt;{selected.from}&gt;</span>
                </div>
                <span>·</span>
                <span className="font-mono text-[11px]">
                  {formatDateTime(new Date(selected.receivedAtIso))}
                </span>
                <span>·</span>
                <span>
                  to <span className="font-mono text-[var(--ink-900)]">invoices@chanakya.app</span>
                </span>
              </div>
            </header>

            {/* Body */}
            <div className="mt-4 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink-700)]">
              {selected.body}
            </div>

            {/* Attachment */}
            <div className="mt-4 rounded-md border border-[var(--border)] bg-white">
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--bad-bg)]">
                  <FileText className="h-4 w-4 text-[var(--bad-fg)]" />
                </div>
                <div className="flex-1">
                  <div className="font-mono text-[12px] text-[var(--ink-900)]">
                    {selected.attachmentName}
                  </div>
                  <div className="text-[11px] text-[var(--ink-500)]">
                    PDF · {selected.attachmentSizeKb} KB
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--saffron-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--saffron-500)] ring-1 ring-[var(--saffron-300)]">
                  <Sparkles className="h-3 w-3" />
                  AI parsed
                </span>
              </div>

              {/* AI-parsed preview */}
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  <Row label="Invoice #" value={selected.parsed.invoiceNumber} mono />
                  <Row label="Vendor" value={selected.vendorCode} mono />
                  <Row label="Issued" value={formatDateTime(new Date(selected.parsed.issuedOnIso)).split(",")[0]!} mono />
                  <Row label="Confidence" value={`${selected.parsed.confidence}/5`} mono />
                  <Row label="Subtotal" value={formatInr(BigInt(selected.parsed.subtotalPaise))} mono />
                  <Row label="Tax" value={formatInr(BigInt(selected.parsed.taxPaise))} mono />
                  <Row label="Total" value={formatInr(BigInt(selected.parsed.totalPaise))} mono strong />
                </div>

                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                    Extracted line items ({selected.parsed.lines.length})
                  </div>
                  <div className="mt-1.5 overflow-hidden rounded border border-[var(--border)]">
                    <table className="w-full text-[12px]">
                      <thead className="bg-[var(--bg-surface-2)] text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">Description</th>
                          <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                          <th className="px-2 py-1.5 text-right font-medium">Unit</th>
                          <th className="px-2 py-1.5 text-right font-medium">Tax</th>
                          <th className="px-2 py-1.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.parsed.lines.map((l, i) => (
                          <tr key={i} className="border-t border-[var(--border)]">
                            <td className="px-2 py-1.5 text-[var(--ink-900)]">{l.description}</td>
                            <td className="px-2 py-1.5 text-right font-mono tabular">{l.quantity}</td>
                            <td className="px-2 py-1.5 text-right font-mono tabular text-[var(--ink-700)]">
                              {formatInr(BigInt(l.unitPricePaise))}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono tabular text-[var(--ink-500)]">
                              {l.taxPct}%
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono tabular text-[var(--ink-900)]">
                              {formatInr(BigInt(l.totalPaise))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-[var(--bad-border)] bg-[var(--bad-bg)] px-3 py-2 text-[12px] text-[var(--bad-fg)]">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              {selected.processed && selected.createdInvoiceVendorCode && selected.createdInvoiceId ? (
                <>
                  <StatusPill tone="ok" label="Processed" />
                  <Link
                    href={`/vendors/${selected.createdInvoiceVendorCode}/invoices/${selected.createdInvoiceId}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)]"
                  >
                    Open invoice
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleProcess(selected.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-50"
                  >
                    {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Sparkles className="h-3.5 w-3.5" />
                    {pending ? "Processing…" : "Create invoice"}
                  </button>
                  <span className="text-[11px] text-[var(--ink-500)]">
                    Creates a real Invoice with source=EMAIL · writes audit · sends notification
                  </span>
                </>
              )}
            </div>
          </article>
        ) : (
          <div className="grid h-full place-items-center text-[12px] text-[var(--ink-500)]">
            Select an email from the inbox.
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <>
      <dt className={"text-[var(--ink-500)] " + (strong ? "font-medium text-[var(--ink-900)]" : "")}>
        {label}
      </dt>
      <dd
        className={
          (mono ? "font-mono tabular " : "") +
          "text-right " +
          (strong ? "font-semibold text-[var(--ink-900)]" : "text-[var(--ink-700)]")
        }
      >
        {value}
      </dd>
    </>
  );
}
