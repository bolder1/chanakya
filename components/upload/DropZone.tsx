"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropZone() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (f: File) => {
    setError(null);
    const okExt = /\.(xlsx|xls|csv)$/i.test(f.name);
    if (!okExt) {
      setError("Only .xlsx, .xls, or .csv files are supported.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Max file size is 20 MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleChoose = () => inputRef.current?.click();

  const handleUpload = () => {
    if (!file) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Upload failed (HTTP ${res.status})`);
        return;
      }
      const { redirect } = await res.json();
      router.push(redirect);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={handleChoose}
        className={cn(
          "cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed p-12 text-center transition-colors",
          dragging
            ? "border-[var(--navy-700)] bg-[var(--navy-50)]"
            : "border-[var(--border-strong)] bg-white hover:bg-[var(--bg-surface-2)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--navy-50)]">
          <UploadCloud className="h-6 w-6 text-[var(--navy-700)]" />
        </div>
        <h2 className="mt-4 text-[16px] font-semibold text-[var(--ink-900)]">
          Drop a payroll, attendance, shift, hostel, invoice or procurement file
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          .xlsx, .xls, or .csv — up to 20 MB. We auto-detect the format, parse messy headers, and preview before commit.
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
          <FileSpreadsheet className="h-5 w-5 text-[var(--ink-400)]" />
          <div className="flex-1">
            <div className="font-mono text-[13px] text-[var(--ink-900)]">{file.name}</div>
            <div className="text-[11px] text-[var(--ink-500)]">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={uploading}
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-500)] hover:bg-[var(--bg-surface-2)]"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--navy-800)] disabled:opacity-50"
          >
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {uploading ? "Parsing…" : "Parse + preview"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-[var(--bad-border)] bg-[var(--bad-bg)] px-3 py-2 text-[12px] text-[var(--bad-fg)]">
          {error}
        </div>
      )}
    </div>
  );
}
