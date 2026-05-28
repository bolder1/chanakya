"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  name: string;
  role: string;
  initials: string;
  email: string;
}

export function UserMenu({ name, role, initials, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2 py-1.5 hover:border-[var(--border-strong)]"
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--navy-700)] text-[11px] font-medium text-white">
          {initials}
        </div>
        <div className="leading-tight text-left">
          <div className="text-[12px] font-medium text-[var(--ink-900)]">{name}</div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--ink-500)]">{role}</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-400)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-md border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
          <div className="border-b border-[var(--border)] px-3 py-2">
            <div className="text-[12px] font-medium text-[var(--ink-900)]">{name}</div>
            <div className="font-mono text-[11px] text-[var(--ink-500)] break-all">{email}</div>
          </div>
          <a
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--ink-700)] hover:bg-[var(--bg-surface-2)]"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-left text-[13px] text-[var(--bad-fg)] hover:bg-[var(--bad-bg)] disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
