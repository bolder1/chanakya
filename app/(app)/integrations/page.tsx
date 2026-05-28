import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { ConnectorActions } from "@/components/chrome/ConnectorActions";
import { prisma } from "@/lib/db";
import { Mail, Building2, Calculator, MessageCircle, Slack, Plug } from "lucide-react";
import { formatDateTime, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";


const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  zoho_people: Building2,
  zoho_payroll: Calculator,
  tally: Calculator,
  email_inbox: Mail,
  slack: Slack,
  whatsapp: MessageCircle,
};

const DESCRIPTIONS: Record<string, string> = {
  zoho_people: "Employee master (read)",
  zoho_payroll: "Statutory computation + disbursement (write)",
  tally: "Accounting journal (write cost data)",
  email_inbox: "invoices@chanakya.app",
  slack: "#finance, #ops-anomalies",
  whatsapp: "Critical anomaly escalations",
};

const statusTone = {
  CONNECTED: "ok" as const,
  DEGRADED: "warn" as const,
  DISCONNECTED: "neutral" as const,
};

export default async function IntegrationsPage() {
  const connectors = await prisma.connector.findMany({
    orderBy: { slug: "asc" },
  });

  return (
    <>
      <Topbar pageTitle="Integrations" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] space-y-6 px-6 py-6">
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--navy-50)]">
                <Plug className="h-4 w-4 text-[var(--navy-700)]" />
              </div>
              <div>
                <h1 className="text-[18px] font-semibold text-[var(--ink-900)]">Integrations</h1>
                <p className="text-[12px] text-[var(--ink-500)]">
                  Read + write connectors to systems of record. AI is advisory; humans approve.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {connectors.map((c) => {
              const Icon = ICONS[c.slug] ?? Plug;
              return (
                <div
                  key={c.slug}
                  className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
                      <Icon className="h-4 w-4 text-[var(--navy-700)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-[var(--ink-900)]">
                          {c.displayName}
                        </h3>
                        <StatusPill tone={statusTone[c.status]} label={c.status} />
                      </div>
                      <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
                        {DESCRIPTIONS[c.slug] ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="font-medium uppercase tracking-wide text-[var(--ink-500)]">Last sync</div>
                      <div className="mt-0.5 font-mono text-[var(--ink-900)]">
                        {c.lastSyncAt ? formatDateTime(c.lastSyncAt) : "—"}
                      </div>
                      {c.lastSyncAt && (
                        <div className="text-[10px] text-[var(--ink-500)]">{formatRelative(c.lastSyncAt)}</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium uppercase tracking-wide text-[var(--ink-500)]">Health</div>
                      <div className={"mt-0.5 " + (c.lastSyncOk ? "text-[var(--ok-fg)]" : c.lastSyncOk === false ? "text-[var(--bad-fg)]" : "text-[var(--ink-500)]")}>
                        {c.lastSyncOk === true ? "OK" : c.lastSyncOk === false ? (c.lastError ?? "Failed") : "Never synced"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[var(--border)] pt-3">
                    <ConnectorActions slug={c.slug} />
                    {c.slug === "email_inbox" && (
                      <a
                        href="/integrations/email-inbox"
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
                      >
                        Open inbox →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
