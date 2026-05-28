"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setUserRole, setUserActive } from "@/lib/actions";
import { StatusPill } from "@/components/status/StatusPill";
import { formatRelative } from "@/lib/format";

type Role =
  | "CFO_FINANCE"
  | "HR_OPS"
  | "VENDOR_MGR"
  | "OPS_MGR"
  | "LEADERSHIP_RO"
  | "SYS_ADMIN";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "CFO_FINANCE", label: "CFO · Finance" },
  { value: "HR_OPS", label: "HR Ops" },
  { value: "VENDOR_MGR", label: "Vendor Manager" },
  { value: "OPS_MGR", label: "Operations" },
  { value: "LEADERSHIP_RO", label: "Leadership (RO)" },
  { value: "SYS_ADMIN", label: "Sys Admin" },
];

interface UserRowProps {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string | null;
  active: boolean;
  lastLoginAtIso: string | null;
  isSelf: boolean;
}

export function UserRow(props: UserRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: Role) => {
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(props.id, newRole);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleToggleActive = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setUserActive(props.id, !props.active);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--navy-700)] text-[11px] font-medium text-white">
            {props.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-[var(--ink-900)]">
              {props.name}
              {props.isSelf && (
                <span className="ml-1.5 rounded bg-[var(--navy-50)] px-1 py-0 font-mono text-[9px] text-[var(--navy-700)]">
                  you
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-[var(--ink-500)]">{props.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={props.role}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          disabled={pending || props.isSelf}
          title={props.isSelf ? "Cannot change your own role" : "Change role"}
          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12px] text-[var(--ink-900)] disabled:cursor-not-allowed disabled:opacity-50 focus:border-[var(--navy-700)]"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">
        {props.team ?? <span className="text-[var(--ink-400)]">—</span>}
      </td>
      <td className="px-4 py-3 text-[12px]">
        <StatusPill
          tone={props.active ? "ok" : "neutral"}
          label={props.active ? "ACTIVE" : "DISABLED"}
        />
      </td>
      <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-500)]">
        {props.lastLoginAtIso ? formatRelative(new Date(props.lastLoginAtIso)) : "never"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={pending || props.isSelf}
          title={props.isSelf ? "Cannot disable yourself" : props.active ? "Disable user" : "Re-activate user"}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          {props.active ? "Disable" : "Activate"}
        </button>
        {error && (
          <div className="mt-1 text-right text-[10px] text-[var(--bad-fg)]">{error}</div>
        )}
      </td>
    </tr>
  );
}
