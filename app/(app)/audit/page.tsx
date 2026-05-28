import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRelative } from "@/lib/format";
import { Download, ScrollText, Filter } from "lucide-react";

export const dynamic = "force-dynamic";


export default async function AuditPage() {
  const [entries, total] = await Promise.all([
    prisma.auditEntry.findMany({
      orderBy: { occurredAt: "desc" },
      take: 100,
      include: {
        actor: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.auditEntry.count(),
  ]);

  // Group counts
  const byAction = new Map<string, number>();
  for (const e of entries) {
    byAction.set(e.action, (byAction.get(e.action) ?? 0) + 1);
  }

  return (
    <>
      <Topbar pageTitle="Audit log" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
          <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--navy-50)]">
                <ScrollText className="h-4 w-4 text-[var(--navy-700)]" />
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  Append-only log
                </div>
                <div className="mt-0.5 font-mono text-[20px] font-semibold text-[var(--ink-900)]">{total}</div>
                <div className="text-[11px] text-[var(--ink-500)]">total entries · showing latest 100</div>
              </div>
            </div>
            <div className="h-12 w-px bg-[var(--border)]" />
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              {[...byAction.entries()].slice(0, 6).map(([action, count]) => (
                <span
                  key={action}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-app)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-700)]"
                >
                  {action} · {count}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)]">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
            {entries.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-[var(--ink-500)]">
                No audit entries yet. Acknowledge or dismiss an anomaly, or run a connector sync to create one.
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">When</th>
                    <th className="px-4 py-2.5 text-left font-medium">Actor · Role</th>
                    <th className="px-4 py-2.5 text-left font-medium">Action</th>
                    <th className="px-4 py-2.5 text-left font-medium">Object</th>
                    <th className="px-4 py-2.5 text-left font-medium">Before → After</th>
                    <th className="px-4 py-2.5 text-left font-medium">Workflow</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[12px] text-[var(--ink-900)]">{formatDateTime(e.occurredAt)}</div>
                        <div className="text-[11px] text-[var(--ink-500)]">{formatRelative(e.occurredAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {e.actor ? (
                          <>
                            <div className="text-[var(--ink-900)]">{e.actor.name}</div>
                            <div className="font-mono text-[11px] text-[var(--ink-500)]">{e.actor.role}</div>
                          </>
                        ) : (
                          <span className="text-[var(--ink-500)] italic text-[12px]">system</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-[var(--ink-900)]">{e.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-[var(--ink-500)]">{e.objectType}</div>
                        <div className="font-mono text-[11px] text-[var(--ink-700)]">{e.objectId.slice(0, 24)}{e.objectId.length > 24 ? "…" : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <ChangePreview before={e.before} after={e.after} />
                      </td>
                      <td className="px-4 py-3">
                        {e.workflow && <StatusPill tone="neutral" label={e.workflow} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function ChangePreview({ before, after }: { before: unknown; after: unknown }) {
  if (!before && !after) return <span className="text-[var(--ink-400)]">—</span>;
  return (
    <div className="font-mono text-[10px] leading-tight">
      {before !== null && before !== undefined && (
        <div className="text-[var(--ink-500)]">- {truncate(JSON.stringify(before))}</div>
      )}
      {after !== null && after !== undefined && (
        <div className="text-[var(--ok-fg)]">+ {truncate(JSON.stringify(after))}</div>
      )}
    </div>
  );
}

function truncate(s: string, n = 80): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}
