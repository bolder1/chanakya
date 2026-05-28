import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gradient-to-r from-[var(--bg-surface-2)] via-[var(--bg-hover)] to-[var(--bg-surface-2)]",
        className,
      )}
    />
  );
}

export function PageSkeleton({
  rows = 6,
  showHero = true,
  showKpis = false,
}: {
  rows?: number;
  showHero?: boolean;
  showKpis?: boolean;
}) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        {showHero && (
          <Skeleton className="h-20 rounded-[var(--radius-card)]" />
        )}
        {showKpis && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />
            ))}
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
