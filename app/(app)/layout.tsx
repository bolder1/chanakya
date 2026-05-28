import { Sidebar } from "@/components/chrome/Sidebar";
import { requireUser, userCaps } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const caps = userCaps(user.role);

  // Sidebar cycle status uses the active OPEN cycle
  const activeCycle = await prisma.cycle.findFirst({
    where: { state: "OPEN" },
    orderBy: { periodEnd: "desc" },
    select: { label: true, state: true },
  });

  return (
    <div className="flex h-screen bg-[var(--bg-app)]">
      <Sidebar
        caps={caps}
        cycleLabel={activeCycle?.label}
        cycleState={activeCycle?.state}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
