"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Sparkles, User } from "lucide-react";
import { askChanakya } from "@/lib/actions";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: { label: string; href?: string }[];
  followUps?: string[];
}

const SUGGESTED = [
  "Why did Aarav Mehta's salary double in April?",
  "Show me all anomalies in vendor invoices this month",
  "How much did we spend on laptops in April vs the 6-month average?",
  "Which vendors have the most invoice issues this quarter?",
  "Show me everything wrong with the April 2026 cycle",
];

export function AskComposer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get("q");

  // If we landed via /ask?q=…, fire the prompt once on mount, then strip the param.
  useEffect(() => {
    if (initialQ && messages.length === 0 && !pending) {
      submit(initialQ);
      router.replace("/ask", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  const submit = (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);

    startTransition(async () => {
      const result = await askChanakya({ question, conversationId });
      if ("conversationId" in result && result.conversationId) {
        setConversationId(result.conversationId);
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: result.message,
          citations: result.citations.map((c) => ({
            label: c.label,
            href:
              c.type === "Employee" ? `/payroll/employees/${c.id}` :
                c.type === "Vendor" ? `/vendors/${c.id}` :
                  c.type === "Cycle" ? `/payroll/${c.id}` :
                    undefined,
          })),
          followUps: result.suggestedFollowUps,
        },
      ]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--saffron-50)] ring-1 ring-[var(--saffron-300)]">
              <Sparkles className="h-5 w-5 text-[var(--saffron-500)]" />
            </div>
            <h2 className="mt-4 text-[20px] font-semibold text-[var(--ink-900)]">
              Ask anything about payroll, vendors, or spend
            </h2>
            <p className="mt-2 max-w-md text-[13px] text-[var(--ink-500)]">
              Chanakya reads your payroll runs, vendor invoices, and procurement entries.
              Answers come with citations to the underlying records.
            </p>
            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  disabled={pending}
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-left text-[13px] text-[var(--ink-900)] hover:border-[var(--navy-700)] hover:bg-[var(--bg-surface-2)] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} onChip={submit} pending={pending} />
            ))}
            {pending && (
              <div className="flex items-start gap-3 text-[13px] text-[var(--ink-500)]">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--saffron-50)] ring-1 ring-[var(--saffron-300)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
                </div>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border)] bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-card)] focus-within:border-[var(--navy-700)]">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a salary, a vendor, or a spend category…"
              disabled={pending}
              className="max-h-32 min-h-[36px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={pending || !input.trim()}
              className="grid h-8 w-8 place-items-center rounded-md bg-[var(--navy-900)] text-white hover:bg-[var(--navy-800)] disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--ink-500)]">
            Scripted engine in V1 · deterministic and cites real records · chat history persists per user
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onChip,
  pending,
}: {
  message: Message;
  onChip: (q: string) => void;
  pending: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--navy-700)] text-white">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 text-[14px] text-[var(--ink-900)] pt-1">{message.content}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--saffron-50)] ring-1 ring-[var(--saffron-300)]">
        <Sparkles className="h-3.5 w-3.5 text-[var(--saffron-500)]" />
      </div>
      <div className="flex-1 space-y-3">
        <p className="text-[14px] leading-relaxed text-[var(--ink-900)]">{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-[var(--ink-500)]">citations</span>
            {message.citations.map((c, i) => (
              c.href ? (
                <a
                  key={`${c.label}-${i}`}
                  href={c.href}
                  className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)] hover:border-[var(--navy-700)] hover:text-[var(--navy-900)]"
                >
                  {c.label}
                </a>
              ) : (
                <span
                  key={`${c.label}-${i}`}
                  className="rounded border border-[var(--border)] bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-700)]"
                >
                  {c.label}
                </span>
              )
            ))}
          </div>
        )}
        {message.followUps && message.followUps.length > 0 && (
          <div className="space-y-1.5">
            {message.followUps.map((q) => (
              <button
                key={q}
                onClick={() => onChip(q)}
                disabled={pending}
                className="block w-full rounded-md border border-[var(--saffron-300)] bg-[var(--saffron-50)]/30 px-2.5 py-1.5 text-left text-[12px] text-[var(--ink-700)] hover:bg-[var(--saffron-50)] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink-400)] animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
