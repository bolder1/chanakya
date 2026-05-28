"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { commitUpload } from "@/lib/actions";

export function CommitButton({ uploadId, disabled }: { uploadId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  const onCommit = () => {
    startTransition(async () => {
      await commitUpload(uploadId);
      setDone(true);
      setTimeout(() => router.refresh(), 800);
    });
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ok-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--ok-fg)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Committed
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onCommit}
      disabled={disabled || pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-50"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Committing…" : "Commit"}
    </button>
  );
}
