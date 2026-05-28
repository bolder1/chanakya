import type { Role } from "@prisma/client";

/**
 * Capability model — server-enforced.
 *
 * Every route handler and Server Action that performs a state change must
 * call `requireCap(session, cap)` before doing work. The client sidebar
 * hides links the user can't see, but the server is the source of truth.
 */

export type Capability =
  | "dashboard.view"
  | "tour.view"
  // Payroll
  | "payroll.view"
  | "payroll.edit"
  | "payroll.approve"
  | "payroll.generate"
  // Vendors
  | "vendors.view"
  | "vendors.edit"
  | "vendors.approve"
  // Spend
  | "spend.view"
  | "spend.edit"
  // Anomalies
  | "anomaly.view"
  | "anomaly.acknowledge"
  | "anomaly.dismiss"
  // Q&A
  | "ai.ask"
  // Uploads
  | "upload.payroll"
  | "upload.invoices"
  | "upload.procurement"
  | "upload.commit"
  // Integrations
  | "integrations.view"
  | "integrations.sync"
  | "integrations.configure"
  // Audit
  | "audit.view"
  | "audit.export"
  // Settings
  | "settings.users"
  | "settings.roles";

const ALL_CAPS = new Set<Capability>([
  "dashboard.view",
  "tour.view",
  "payroll.view",
  "payroll.edit",
  "payroll.approve",
  "payroll.generate",
  "vendors.view",
  "vendors.edit",
  "vendors.approve",
  "spend.view",
  "spend.edit",
  "anomaly.view",
  "anomaly.acknowledge",
  "anomaly.dismiss",
  "ai.ask",
  "upload.payroll",
  "upload.invoices",
  "upload.procurement",
  "upload.commit",
  "integrations.view",
  "integrations.sync",
  "integrations.configure",
  "audit.view",
  "audit.export",
  "settings.users",
  "settings.roles",
]);

const CAP_MATRIX: Record<Role, Capability[]> = {
  CFO_FINANCE: [
    "dashboard.view",
    "tour.view",
    "payroll.view",
    "payroll.approve",
    "payroll.generate",
    "vendors.view",
    "vendors.approve",
    "spend.view",
    "anomaly.view",
    "anomaly.acknowledge",
    "anomaly.dismiss",
    "ai.ask",
    "upload.payroll",
    "upload.invoices",
    "upload.procurement",
    "upload.commit",
    "integrations.view",
    "integrations.sync",
    "audit.view",
    "audit.export",
  ],
  HR_OPS: [
    "dashboard.view",
    "tour.view",
    "payroll.view",
    "payroll.edit",
    "payroll.approve",
    "anomaly.view",
    "anomaly.acknowledge",
    "anomaly.dismiss",
    "ai.ask",
    "upload.payroll",
    "upload.commit",
    "audit.view",
  ],
  VENDOR_MGR: [
    "dashboard.view",
    "tour.view",
    "vendors.view",
    "vendors.edit",
    "vendors.approve",
    "anomaly.view",
    "anomaly.acknowledge",
    "anomaly.dismiss",
    "ai.ask",
    "upload.invoices",
    "upload.commit",
  ],
  OPS_MGR: [
    "dashboard.view",
    "tour.view",
    "spend.view",
    "spend.edit",
    "anomaly.view",
    "anomaly.acknowledge",
    "anomaly.dismiss",
    "ai.ask",
    "upload.procurement",
    "upload.commit",
  ],
  LEADERSHIP_RO: [
    "dashboard.view",
    "tour.view",
    "payroll.view",
    "vendors.view",
    "spend.view",
    "anomaly.view",
    "ai.ask",
    "audit.view",
  ],
  SYS_ADMIN: [
    "dashboard.view",
    "tour.view",
    "integrations.view",
    "integrations.sync",
    "integrations.configure",
    "audit.view",
    "audit.export",
    "settings.users",
    "settings.roles",
  ],
};

/** Check whether a role has a given capability. */
export function roleCan(role: Role, cap: Capability): boolean {
  if (!ALL_CAPS.has(cap)) {
    throw new Error(`Unknown capability: ${cap}`);
  }
  return CAP_MATRIX[role].includes(cap);
}

/** All caps a role holds — used for client-side menu pruning. */
export function capsForRole(role: Role): Capability[] {
  return [...CAP_MATRIX[role]];
}
