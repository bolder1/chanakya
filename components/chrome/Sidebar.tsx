"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Building2,
  ShoppingCart,
  MessageSquareText,
  UploadCloud,
  Plug,
  ScrollText,
  Settings,
  Sparkles,
  Play,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Capability } from "@/lib/rbac/capabilities";

interface SidebarProps {
  caps: Capability[];
  cycleLabel?: string;
  cycleState?: string;
}

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  cap: Capability;
  accent?: boolean;
};

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, cap: "dashboard.view" },
  { href: "/anomalies", label: "Anomalies", icon: AlertTriangle, cap: "anomaly.view" },
  { href: "/payroll", label: "Payroll", icon: Receipt, cap: "payroll.view" },
  { href: "/vendors", label: "Vendors", icon: Building2, cap: "vendors.view" },
  { href: "/spend", label: "Spend", icon: ShoppingCart, cap: "spend.view" },
  { href: "/ask", label: "Ask", icon: MessageSquareText, cap: "ai.ask", accent: true },
  { href: "/uploads", label: "Uploads", icon: UploadCloud, cap: "upload.commit" },
  { href: "/integrations", label: "Integrations", icon: Plug, cap: "integrations.view" },
  { href: "/audit", label: "Audit", icon: ScrollText, cap: "audit.view" },
  { href: "/settings", label: "Settings", icon: Settings, cap: "settings.users" },
  { href: "/tour", label: "Demo tour", icon: Play, cap: "tour.view", accent: true },
];

export function Sidebar({ caps, cycleLabel, cycleState }: SidebarProps) {
  const pathname = usePathname();
  const capSet = new Set(caps);
  const visible = ALL_NAV.filter((item) => capSet.has(item.cap));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--navy-900)] text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--saffron-500)]">
          <Sparkles className="h-4 w-4 text-[var(--navy-900)]" strokeWidth={2.5} />
        </div>
        <div className="font-semibold tracking-tight">
          Chanakya
          <span className="ml-1 text-[10px] font-mono text-[var(--saffron-300)]">v0.1</span>
        </div>
      </div>

      <nav className="mt-2 flex-1 px-2">
        {visible.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[var(--saffron-400)]" : "text-white/60",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.accent && (
                <span className="rounded-full bg-[var(--saffron-500)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--saffron-300)]">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/50">
        <div className="flex items-center justify-between">
          <span>Cycle</span>
          <span className="font-mono text-white/80">{cycleLabel ?? "—"}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Status</span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                cycleState === "OPEN"
                  ? "bg-[var(--ok-dot)]"
                  : cycleState === "LOCKED"
                    ? "bg-[var(--info-dot)]"
                    : "bg-[var(--neutral-dot)]",
              )}
            />
            <span className="text-white/80">{cycleState ?? "—"}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
