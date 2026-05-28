import { Search } from "lucide-react";
import { UserMenu } from "@/components/chrome/UserMenu";
import { NotificationsBell } from "@/components/chrome/NotificationsBell";
import { getUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatRelative } from "@/lib/format";

interface TopbarProps {
  pageTitle: string;
}

export async function Topbar({ pageTitle }: TopbarProps) {
  const user = await getUser();

  let notifications: Awaited<ReturnType<typeof loadNotifications>> = { items: [], unread: 0 };
  if (user) {
    notifications = await loadNotifications(user.id);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6">
      <h1 className="text-[15px] font-semibold text-[var(--ink-900)]">{pageTitle}</h1>

      <div className="ml-6 flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-400)]" />
          <input
            type="text"
            placeholder="Search employees, vendors, invoices…"
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-app)] pl-9 pr-3 text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:border-[var(--navy-700)] focus:bg-white"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--border-strong)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-500)]">
            /
          </kbd>
        </div>
      </div>

      <NotificationsBell notifications={notifications.items} unreadCount={notifications.unread} />

      {user && (
        <UserMenu
          name={user.name}
          role={user.roleLabel}
          initials={user.initials}
          email={user.email}
        />
      )}
    </header>
  );
}

async function loadNotifications(userId: string) {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      severity: r.severity,
      title: r.title,
      body: r.body,
      link: r.link,
      channel: r.channel,
      sentAtRelative: formatRelative(r.sentAt),
      readAt: r.readAt ? r.readAt.toISOString() : null,
    })),
    unread,
  };
}
