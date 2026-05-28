import { Construction, Sparkles } from "lucide-react";

interface ComingSoonProps {
  module: string;
  week: string;
  scope: string;
  scenarios?: string[];
}

export function ComingSoon({ module, week, scope, scenarios }: ComingSoonProps) {
  return (
    <main className="flex flex-1 items-center justify-center overflow-y-auto bg-[var(--bg-app)] px-6 py-12">
      <div className="w-full max-w-xl rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
            <Construction className="h-5 w-5 text-[var(--navy-700)]" />
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold text-[var(--ink-900)]">
              {module}
            </h1>
            <p className="mt-1 text-[12px] font-mono uppercase tracking-wide text-[var(--saffron-500)]">
              Ships in {week}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--ink-700)]">
              {scope}
            </p>
            {scenarios && scenarios.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
                  <Sparkles className="mr-1 inline h-3 w-3 text-[var(--saffron-500)]" />
                  Anomalies it will surface
                </p>
                <ul className="mt-2 space-y-1 text-[13px] text-[var(--ink-700)]">
                  {scenarios.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--navy-700)]" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
