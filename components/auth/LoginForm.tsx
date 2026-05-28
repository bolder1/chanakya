"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

const DEMO_USERS = [
  { email: "cfo@miniorange.test", role: "CFO · Finance" },
  { email: "hrops@miniorange.test", role: "HR Ops" },
  { email: "vendor@miniorange.test", role: "Vendor Manager" },
  { email: "ops@miniorange.test", role: "Operations" },
  { email: "leadership@miniorange.test", role: "Leadership (read-only)" },
  { email: "sysadmin@miniorange.test", role: "Sys Admin" },
];

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        // Non-revealing error — don't say "wrong password" vs "no user"
        setError("This action couldn't be completed. Check with your administrator.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo");
    setError(null);
  };

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1fr_460px]">
      {/* Left — brand panel with gradient mesh */}
      <aside className="gradient-mesh relative hidden flex-col justify-between px-12 py-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-[var(--primary)]">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[16px] font-medium tracking-tight text-[var(--ink-900)]">
              Chanakya
            </div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--primary-deep)]">
              v0.1
            </div>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <h1
            className="text-[48px] font-light leading-[1.05] tracking-[-0.96px] text-[var(--ink-900)]"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            AI-powered payroll &amp; finance intelligence
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            See every salary cycle, every vendor invoice, every procurement
            entry — and the anomalies hiding in them — in one place. Built for
            MiniOrange Finance, HR Ops, Vendor Management, and Operations.
          </p>
          <ul className="space-y-2 text-[13px] text-[var(--ink-700)]">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--primary)]" />
              <span className="tabular">486 employees · 18 monthly cycles · 41 vendors · 530 invoices</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--ruby)]" />
              Drag-drop Excel ingestion · header-vs-line reconciliation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--magenta)]" />
              Append-only audit log · role-based access · AI is advisory
            </li>
          </ul>
        </div>

        <div className="text-[11px] text-[var(--ink-500)]">
          © MiniOrange · Chanakya runs on MiniOrange infrastructure
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex flex-col justify-center bg-[var(--bg-app)] px-8 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[var(--saffron-500)]">
              <Sparkles className="h-4 w-4 text-[var(--navy-900)]" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight text-[var(--ink-900)]">Chanakya</span>
          </div>

          <h2 className="text-[24px] font-semibold tracking-tight text-[var(--ink-900)]">
            Sign in
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            Use any of the seeded demo accounts below.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="you@miniorange.test"
              disabled={pending}
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="demo"
              disabled={pending}
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-[var(--bad-border)] bg-[var(--bad-bg)] px-3 py-2 text-[12px] text-[var(--bad-fg)]">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !email || !password}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 text-[15px] font-normal text-white hover:bg-[var(--primary-deep)] active:bg-[var(--primary-press)] active:translate-y-px disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-500)]">
              Demo accounts (password: demo)
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillDemo(u.email)}
                  disabled={pending}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-left text-[12px] hover:border-[var(--navy-700)] hover:bg-[var(--bg-surface-2)] disabled:opacity-50"
                >
                  <span className="font-mono text-[var(--ink-900)]">{u.email}</span>
                  <span className="text-[var(--ink-500)]">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
}: {
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[var(--ink-700)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-1 block h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:border-[var(--navy-700)] focus:outline-none disabled:bg-[var(--bg-surface-2)]"
      />
    </label>
  );
}
