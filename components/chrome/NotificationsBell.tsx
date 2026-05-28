"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, UploadCloud, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  kind: "ANOMALY" | "UPLOAD" | "SYSTEM";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  title: string;
  body: string;
  link: string | null;
  channel: "IN_APP" | "SLACK" | "WHATSAPP" | "EMAIL";
  sentAtRelative: string;
  readAt: string | null;
}

interface NotificationsBellProps {
  notifications: NotificationRow[];
  unreadCount: number;
}

export function NotificationsBell({ notifications, unreadCount }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-white text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--bad-dot)] px-1 font-mono text-[9px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-96 overflow-hidden rounded-md border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <div>
              <div className="text-[13px] font-semibold text-[var(--ink-900)]">Notifications</div>
              <div className="text-[10px] text-[var(--ink-500)]">
                {unreadCount} unread · {notifications.length} total
              </div>
            </div>
            <Link
              href="/audit"
              className="text-[11px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]"
              onClick={() => setOpen(false)}
            >
              See audit →
            </Link>
          </header>
          <div className="max-h-[440px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-[var(--ink-500)]">
                No notifications yet. Acknowledge an anomaly to generate one.
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <NotifRow key={n.id} n={n} onNavigate={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n, onNavigate }: { n: NotificationRow; onNavigate: () => void }) {
  const Icon = n.kind === "UPLOAD" ? UploadCloud : n.kind === "SYSTEM" ? SettingsIcon : AlertTriangle;
  const channelLabel =
    n.channel === "SLACK" ? "Sent to #finance" :
      n.channel === "WHATSAPP" ? "WhatsApp" :
        n.channel === "EMAIL" ? "Email" :
          "In-app";

  const body = (
    <>
      <div
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-md",
          n.severity === "CRITICAL"
            ? "bg-[var(--bad-bg)] text-[var(--bad-fg)]"
            : n.severity === "HIGH"
              ? "bg-[var(--warn-bg)] text-[var(--warn-fg)]"
              : "bg-[var(--navy-50)] text-[var(--navy-700)]",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] font-medium text-[var(--ink-900)]">
            {n.title}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-[var(--ink-500)]">
            {n.sentAtRelative}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--ink-500)]">{n.body}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-app)] px-1 py-0 font-mono text-[9px] text-[var(--ink-500)]">
            {channelLabel}
          </span>
          {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-[var(--info-dot)]" />}
        </div>
      </div>
    </>
  );

  if (n.link) {
    return (
      <li>
        <Link
          href={n.link}
          onClick={onNavigate}
          className={cn(
            "flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 hover:bg-[var(--bg-surface-2)]",
            !n.readAt && "bg-[var(--info-bg)]/30",
          )}
        >
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li className={cn("flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0", !n.readAt && "bg-[var(--info-bg)]/30")}>
      {body}
    </li>
  );
}
