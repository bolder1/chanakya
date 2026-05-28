import Link from "next/link";
import { Topbar } from "@/components/chrome/Topbar";
import { Sparkles, Receipt, Building2, ShoppingCart, MessageSquareText, ChevronRight, Play } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface DemoStep {
  label: string;
  description?: string;
  href?: string;
  askPrompt?: string;
  badge?: "CRITICAL" | "HIGH" | "MEDIUM";
}

interface Scenario {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  whatToShow: string;
  steps: DemoStep[];
}

export default async function TourPage() {
  // Pull live data so the tour adapts to the seeded state.
  const [activeCycle, criticalAnomaly, hostelAnomaly] = await Promise.all([
    prisma.cycle.findFirst({ where: { state: "OPEN" }, orderBy: { periodEnd: "desc" } }),
    prisma.anomaly.findFirst({
      where: { severity: "CRITICAL", status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      include: { employee: true, cycle: true },
    }),
    prisma.anomaly.findFirst({
      where: { kind: "HOSTEL_PAYROLL_MISMATCH" },
      include: { employee: true },
    }),
  ]);

  const cycleLabel = activeCycle?.label ?? "2026-04";
  const criticalEmpId = criticalAnomaly?.employee?.empId ?? "EMP-0142";
  const hostelEmpId = hostelAnomaly?.employee?.empId ?? "EMP-0349";

  const scenarios: Scenario[] = [
    {
      number: 1,
      icon: Receipt,
      title: "Salary anomaly",
      subtitle: "Payroll · 4 anomalies",
      whatToShow:
        "EMP-0142 was paid 2× normal in Apr 2026 — a duplicate CORRECTION run. We catch it, explain it, link to the underlying records, and acknowledge it.",
      steps: [
        {
          label: "Open the payroll anomaly inbox",
          description: `${cycleLabel} cycle · 4 payroll anomalies (1 critical, 2 high, 1 medium)`,
          href: `/payroll/${cycleLabel}/anomalies`,
        },
        {
          label: `Drill into ${criticalEmpId}'s 18-month chart`,
          description: "Saffron dot marks the April spike — chart speaks for itself.",
          href: `/payroll/employees/${criticalEmpId}`,
          badge: "CRITICAL",
        },
        {
          label: "Ask: Why did Aarav Mehta's salary double?",
          description: "Scripted answer with citation chips deep-linking back to records.",
          askPrompt: "Why did Aarav Mehta's salary double in April?",
        },
      ],
    },
    {
      number: 2,
      icon: Building2,
      title: "Vendor invoice reconciliation",
      subtitle: "Vendors · 6 anomalies",
      whatToShow:
        "Bharat Logistics sent an invoice where the header total doesn't match the line items — ₹64,500 line silently missing. Plus duplicate, price drift, GSTIN-invalid, and TDS-reflection mismatch cases.",
      steps: [
        {
          label: "Open the vendor anomaly inbox",
          description: "All 6 invoice anomalies sorted by severity.",
          href: "/vendors/anomalies",
        },
        {
          label: "Bharat Logistics → header-vs-lines reconciliation",
          description:
            "₹4,82,000 header vs ₹4,17,500 lines — saffron-bordered missing line called out.",
          href: "/vendors/VEN-022",
          badge: "HIGH",
        },
        {
          label: "DataDrive — Dell Latitude unit price drift +17–19%",
          description: "12-month spend chart shows the recent breakout.",
          href: "/vendors/VEN-014",
          badge: "HIGH",
        },
      ],
    },
    {
      number: 3,
      icon: ShoppingCart,
      title: "External spend variance",
      subtitle: "Spend · 4 anomalies",
      whatToShow:
        "Laptops category +131% vs the 6-month average. Tomato prices jumped 86% from Annapurna Mart. Off-contract catering. Threshold-avoidance split purchases.",
      steps: [
        {
          label: "Open the spend dashboard",
          description: "Saffron-bordered cards mark categories with anomalies.",
          href: "/spend",
        },
        {
          label: "Open the spend anomaly inbox",
          description: "All 4 spend anomalies with full narratives.",
          href: "/spend/anomalies",
          badge: "HIGH",
        },
        {
          label: "Ask: How much did we spend on laptops in April?",
          description:
            "AI answers with the 131% variance + the 3 large purchases that drove it.",
          askPrompt: "How much did we spend on laptops in April vs the 6-month average?",
        },
      ],
    },
    {
      number: 4,
      icon: MessageSquareText,
      title: "Natural-language Q&A",
      subtitle: "Ask Chanakya · scripted AI",
      whatToShow:
        "Type a sentence, get a cited answer in seconds. Free-typed gibberish gracefully falls back to suggestion chips — the demo never breaks.",
      steps: [
        {
          label: "Ask: Show me everything wrong with April",
          description: "Cross-domain summary covering payroll, vendors, and spend.",
          askPrompt: "Show me everything wrong with the April 2026 cycle",
        },
        {
          label: "Ask: Which vendors have invoice issues this quarter?",
          description: "Lists offenders with severity + citation chips.",
          askPrompt: "Which vendors have the most invoice issues this quarter?",
        },
        {
          label: `Ask: ${hostelEmpId}'s hostel deduction`,
          description: "Surfaces the ₹2,130 over-deduction between hostel sheet and salary GUEST HOUSE column.",
          askPrompt: "Tell me about hostel deductions vs salary",
        },
      ],
    },
  ];

  return (
    <>
      <Topbar pageTitle="Demo tour" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] space-y-6 px-6 py-6">
          {/* Hero */}
          <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--saffron-300)] bg-gradient-to-br from-[var(--saffron-50)] to-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-[var(--saffron-300)]">
                <Play className="h-5 w-5 text-[var(--saffron-500)]" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--saffron-500)]">
                  Tour mode
                </div>
                <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight text-[var(--ink-900)]">
                  The 22-minute Chanakya demo
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--ink-700)]">
                  Click any chip below to jump to that demo moment. Each scenario walks
                  through a real anomaly we've planted in the seeded data — the AI doesn't
                  improvise on stage. Recommended order: 1 → 2 → 3 → 4, ~5 minutes each.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scenarios.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.number}
                    href={`#scenario-${s.number}`}
                    className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-[12px] hover:border-[var(--saffron-300)]"
                  >
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--navy-50)]">
                      <Icon className="h-3.5 w-3.5 text-[var(--navy-700)]" />
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
                        Scenario {s.number}
                      </div>
                      <div className="text-[13px] font-medium text-[var(--ink-900)]">
                        {s.title}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Scenarios */}
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <section
                key={s.number}
                id={`scenario-${s.number}`}
                className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] scroll-mt-6"
              >
                <header className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--navy-50)]">
                    <Icon className="h-5 w-5 text-[var(--navy-700)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[var(--navy-900)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                        S{s.number}
                      </span>
                      <h2 className="text-[18px] font-semibold tracking-tight text-[var(--ink-900)]">
                        {s.title}
                      </h2>
                      <span className="text-[11px] text-[var(--ink-500)]">·</span>
                      <span className="text-[11px] text-[var(--ink-500)]">{s.subtitle}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-700)]">
                      {s.whatToShow}
                    </p>
                  </div>
                </header>

                <ol className="mt-5 space-y-2">
                  {s.steps.map((step, i) => (
                    <li key={i}>
                      <StepChip step={step} number={i + 1} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}

          {/* Closer */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--navy-50)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-900)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
              Closing the demo
            </h2>
            <ol className="mt-3 space-y-1.5 text-[13px] text-[var(--ink-700)]">
              <li className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--ink-500)]">5.</span>
                <Link href="/audit" className="font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                  Open /audit
                </Link>
                — show every action you triggered during the demo, with before/after JSON.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--ink-500)]">6.</span>
                <Link href="/integrations" className="font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                  Open /integrations
                </Link>
                — click "Run sync" on the Tally card → DEGRADED → CONNECTED + audit entry.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--ink-500)]">7.</span>
                <Link href="/uploads" className="font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
                  Open /uploads
                </Link>
                — drop <code className="font-mono text-[11px]">data/samples/payroll-input.messy.xlsx</code> for the live ingestion finale.
              </li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}

function StepChip({ step, number }: { step: DemoStep; number: number }) {
  const content = (
    <>
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--saffron-50)] font-mono text-[11px] font-semibold text-[var(--saffron-500)] ring-1 ring-[var(--saffron-300)]">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--ink-900)]">{step.label}</span>
          {step.badge && (
            <span
              className={
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                (step.badge === "CRITICAL"
                  ? "bg-[var(--bad-bg)] text-[var(--bad-fg)]"
                  : step.badge === "HIGH"
                    ? "bg-[var(--warn-bg)] text-[var(--warn-fg)]"
                    : "bg-[var(--info-bg)] text-[var(--info-fg)]")
              }
            >
              {step.badge}
            </span>
          )}
          {step.askPrompt && (
            <span className="rounded border border-[var(--saffron-300)] bg-[var(--saffron-50)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--saffron-500)]">
              AI
            </span>
          )}
        </div>
        {step.description && (
          <div className="mt-0.5 text-[12px] text-[var(--ink-500)]">{step.description}</div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
    </>
  );

  if (step.href) {
    return (
      <Link
        href={step.href}
        className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-2.5 hover:border-[var(--navy-700)] hover:bg-[var(--bg-surface-2)]"
      >
        {content}
      </Link>
    );
  }
  if (step.askPrompt) {
    return (
      <Link
        href={`/ask?q=${encodeURIComponent(step.askPrompt)}`}
        className="flex items-center gap-3 rounded-md border border-[var(--saffron-300)] bg-[var(--saffron-50)]/40 px-3 py-2.5 hover:bg-[var(--saffron-50)]"
      >
        {content}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-2.5">{content}</div>;
}
