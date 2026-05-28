import { Topbar } from "@/components/chrome/Topbar";
import { StatusPill } from "@/components/status/StatusPill";
import { UserRow } from "@/components/settings/UserRow";
import { prisma } from "@/lib/db";
import { requireCap } from "@/lib/session";
import { capsForRole, type Capability } from "@/lib/rbac/capabilities";
import { Users, ShieldCheck, Cog, CheckCircle2, MinusCircle } from "lucide-react";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  CFO_FINANCE: "CFO · Finance",
  HR_OPS: "HR Ops",
  VENDOR_MGR: "Vendor Mgr",
  OPS_MGR: "Operations",
  LEADERSHIP_RO: "Leadership",
  SYS_ADMIN: "Sys Admin",
};

const ALL_ROLES: Role[] = [
  "CFO_FINANCE",
  "HR_OPS",
  "VENDOR_MGR",
  "OPS_MGR",
  "LEADERSHIP_RO",
  "SYS_ADMIN",
];

const CAP_GROUPS: { name: string; caps: Capability[] }[] = [
  { name: "Read", caps: ["dashboard.view", "tour.view", "payroll.view", "vendors.view", "spend.view", "anomaly.view", "audit.view", "integrations.view"] },
  { name: "Edit", caps: ["payroll.edit", "vendors.edit", "spend.edit"] },
  { name: "Approve", caps: ["payroll.approve", "vendors.approve", "payroll.generate"] },
  { name: "Anomaly", caps: ["anomaly.acknowledge", "anomaly.dismiss"] },
  { name: "AI + Uploads", caps: ["ai.ask", "upload.payroll", "upload.invoices", "upload.procurement", "upload.commit"] },
  { name: "Admin", caps: ["integrations.sync", "integrations.configure", "audit.export", "settings.users", "settings.roles"] },
];

export default async function SettingsPage() {
  const me = await requireCap("settings.users");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const aiEngine = process.env.CHANAKYA_AI_ENGINE ?? "scripted";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasAuthSecret = !!(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);

  return (
    <>
      <Topbar pageTitle="Settings" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {/* Header */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--navy-50)]">
                <Cog className="h-5 w-5 text-[var(--navy-700)]" />
              </div>
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight text-[var(--ink-900)]">
                  Settings
                </h1>
                <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
                  Users, roles, and system configuration. Sys Admin only — every
                  change is audit-trailed.
                </p>
              </div>
            </div>
          </section>

          {/* USERS */}
          <section>
            <header className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--navy-700)]" />
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Users
              </h2>
              <span className="text-[12px] text-[var(--ink-500)]">
                {users.length} total · {users.filter((u) => u.active).length} active
              </span>
            </header>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[13px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[11px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">User</th>
                    <th className="px-4 py-2.5 text-left font-medium">Role</th>
                    <th className="px-4 py-2.5 text-left font-medium">Team</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Last login</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow
                      key={u.id}
                      id={u.id}
                      name={u.name}
                      email={u.email}
                      role={u.role}
                      team={u.team}
                      active={u.active}
                      lastLoginAtIso={u.lastLoginAt ? u.lastLoginAt.toISOString() : null}
                      isSelf={u.id === me.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ROLE MATRIX */}
          <section>
            <header className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--navy-700)]" />
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                Role × capability matrix
              </h2>
              <span className="text-[12px] text-[var(--ink-500)]">
                Server-enforced via lib/rbac/capabilities.ts
              </span>
            </header>
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
              <table className="w-full text-[12px]">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Capability</th>
                    {ALL_ROLES.map((r) => (
                      <th key={r} className="px-3 py-2 text-center font-medium whitespace-nowrap">
                        {ROLE_LABEL[r]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAP_GROUPS.map((group) => (
                    <CapGroup key={group.name} group={group} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SYSTEM */}
          <section>
            <header className="mb-3 flex items-center gap-2">
              <Cog className="h-4 w-4 text-[var(--navy-700)]" />
              <h2 className="text-[14px] font-semibold text-[var(--ink-900)]">
                System
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SystemTile
                label="AI engine"
                value={aiEngine}
                hint={
                  aiEngine === "scripted"
                    ? "Hand-tuned narratives keyed to seeded anomaly fingerprints. Deterministic."
                    : "LLM mode (V2). Falls back to scripted if not implemented yet."
                }
                tone="info"
              />
              <SystemTile
                label="Environment"
                value={nodeEnv}
                hint={nodeEnv === "production" ? "Live data — be careful." : "Local dev — safe to experiment."}
                tone={nodeEnv === "production" ? "warn" : "neutral"}
              />
              <SystemTile
                label="Database connection"
                value={hasDbUrl ? "configured" : "missing"}
                hint={hasDbUrl ? "DATABASE_URL is set." : "DATABASE_URL missing — add to .env.local."}
                tone={hasDbUrl ? "ok" : "bad"}
              />
              <SystemTile
                label="Auth secret"
                value={hasAuthSecret ? "configured" : "missing"}
                hint={hasAuthSecret ? "AUTH_SECRET is set; JWT sessions valid." : "Set AUTH_SECRET to a 64-char hex string."}
                tone={hasAuthSecret ? "ok" : "bad"}
              />
              <SystemTile
                label="Audit immutability"
                value="trigger active"
                hint="Postgres trigger physically rejects UPDATE/DELETE on audit_entries."
                tone="ok"
              />
              <SystemTile
                label="Session TTL"
                value="8h JWT"
                hint="Workday-length. Edit lib/auth.config.ts to change."
                tone="neutral"
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function CapGroup({ group }: { group: { name: string; caps: Capability[] } }) {
  return (
    <>
      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]/60">
        <td colSpan={ALL_ROLES.length + 1} className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
          {group.name}
        </td>
      </tr>
      {group.caps.map((cap) => (
        <tr key={cap} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]/40">
          <td className="px-3 py-1.5 font-mono text-[11px] text-[var(--ink-900)]">
            {cap}
          </td>
          {ALL_ROLES.map((role) => {
            const has = capsForRole(role).includes(cap);
            return (
              <td key={role} className="px-3 py-1.5 text-center">
                {has ? (
                  <CheckCircle2 className="inline h-3.5 w-3.5 text-[var(--ok-fg)]" />
                ) : (
                  <MinusCircle className="inline h-3.5 w-3.5 text-[var(--ink-300)]" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function SystemTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "ok" | "warn" | "bad" | "info" | "neutral";
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
          {label}
        </div>
        <StatusPill tone={tone} label={value} />
      </div>
      <p className="mt-2 text-[12px] text-[var(--ink-700)]">{hint}</p>
    </div>
  );
}
