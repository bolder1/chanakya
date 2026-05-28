"use client";

import { useTransition, useState } from "react";
import { triggerConnectorSync } from "@/lib/actions";

interface ConnectorActionsProps {
  slug: string;
}

export function ConnectorActions({ slug }: ConnectorActionsProps) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"ok" | null>(null);

  const onSync = () => {
    startTransition(async () => {
      await triggerConnectorSync(slug);
      setFlash("ok");
      setTimeout(() => setFlash(null), 2500);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={pending}
        className="rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] hover:border-[var(--border-strong)] disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Run sync"}
      </button>
      <button className="text-[12px] font-medium text-[var(--navy-700)] hover:text-[var(--navy-900)]">
        Configure
      </button>
      {flash === "ok" && (
        <span className="text-[11px] text-[var(--ok-fg)]">Synced · audited</span>
      )}
    </div>
  );
}
