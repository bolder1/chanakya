import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { EmailInbox } from "@/components/inbox/EmailInbox";
import { getInboxState } from "@/lib/email-inbox";
import { ChevronLeft, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmailInboxPage() {
  const emails = await getInboxState();

  const serialized = emails.map((e) => ({
    id: e.id,
    from: e.from,
    fromName: e.fromName,
    vendorCode: e.vendorCode,
    subject: e.subject,
    receivedAtIso: e.receivedAt.toISOString(),
    body: e.body,
    attachmentName: e.attachmentName,
    attachmentSizeKb: e.attachmentSizeKb,
    parsed: {
      invoiceNumber: e.parsed.invoiceNumber,
      issuedOnIso: e.parsed.issuedOn.toISOString(),
      subtotalPaise: String(e.parsed.subtotalPaise),
      taxPaise: String(e.parsed.taxPaise),
      totalPaise: String(e.parsed.totalPaise),
      confidence: e.parsed.confidence,
      lines: e.parsed.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPricePaise: String(l.unitPricePaise),
        taxPct: l.taxPct,
        totalPaise: String(l.totalPaise),
      })),
    },
    processed: e.processed,
    createdInvoiceId: e.createdInvoiceId,
    createdInvoiceVendorCode: e.createdInvoiceVendorCode,
  }));

  return (
    <>
      <Topbar pageTitle="Email inbox · invoices@chanakya.app" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All integrations
          </Link>

          <section className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--navy-50)]">
              <Mail className="h-5 w-5 text-[var(--navy-700)]" />
            </div>
            <div className="flex-1">
              <h1 className="text-[18px] font-semibold text-[var(--ink-900)]">
                invoices@chanakya.app
              </h1>
              <p className="text-[12px] text-[var(--ink-500)]">
                Vendors forward invoices to this address. AI extracts the line
                items, tax, and totals from the attached PDF. A human approves
                before it becomes a real Invoice record.
              </p>
            </div>
          </section>

          <EmailInbox emails={serialized} />
        </div>
      </main>
    </>
  );
}
