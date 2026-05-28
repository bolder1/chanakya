import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { capsForRole, roleCan, type Capability } from "@/lib/rbac/capabilities";

const ROLE_DISPLAY: Record<Role, string> = {
  CFO_FINANCE: "CFO · Finance",
  HR_OPS: "HR Ops",
  VENDOR_MGR: "Vendor Manager",
  OPS_MGR: "Operations",
  LEADERSHIP_RO: "Leadership",
  SYS_ADMIN: "Sys Admin",
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  team: string | null;
  initials: string;
}

/**
 * Get the current session user or redirect to /login.
 * Use in every server component that needs auth.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const u = session.user;
  const name = u.name ?? u.email ?? "User";
  return {
    id: u.id,
    name,
    email: u.email ?? "",
    role: u.role,
    roleLabel: ROLE_DISPLAY[u.role] ?? u.role,
    team: u.team ?? null,
    initials: initialsOf(name),
  };
}

/**
 * Get the session user or return null. Use when a page can render
 * a different state for logged-out vs logged-in users.
 */
export async function getUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user;
  const name = u.name ?? u.email ?? "User";
  return {
    id: u.id,
    name,
    email: u.email ?? "",
    role: u.role,
    roleLabel: ROLE_DISPLAY[u.role] ?? u.role,
    team: u.team ?? null,
    initials: initialsOf(name),
  };
}

/**
 * Require a capability — redirects to /dashboard with a flash if missing.
 * Server-enforced; clients never see hidden routes.
 */
export async function requireCap(cap: Capability): Promise<SessionUser> {
  const user = await requireUser();
  if (!roleCan(user.role, cap)) {
    redirect("/dashboard?denied=" + encodeURIComponent(cap));
  }
  return user;
}

export function userCaps(role: Role): Capability[] {
  return capsForRole(role);
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
