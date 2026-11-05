"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { StrategyCard, type StrategyOutput } from "./strategy-card";

const EXAMPLES = [
  "How do I win back my lapsed customers?",
  "Which customers should get a Christmas offer?",
  "How do I turn Occasional regulars into Loyal regulars?",
  "Which categories are struggling?",
  "Give me a strategy for my New & undecided customers",
];

const STORE_KEY = "witomni-assistant-chat";

function toolStatus(name: string, input: Record<string, unknown> | undefined): string {
  switch (name) {
    case "get_overview":
      return "Looking up your business overview…";
    case "get_segment_summary":
      return `Looking up ${String(input?.segment ?? "the segment")}…`;
    case "get_customer":
      return `Looking up customer ${String(input?.customer_id ?? "")}…`;
    case "top_customers_for_category":
      return `Looking up ${String(input?.category ?? "category")} buyers…`;
    case "low_purchase_categories":
      return "Looking up your weakest categories…";
    default:
      return "Putting the plan together…";
  }
}

/** Errors from the API come back as JSON `{ error }`; show only that sentence. */
function friendlyError(err: Error | undefined): string {
  if (!err) return "";
  try {
    const parsed = JSON.parse(err.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* not JSON */
  }
  return /fetch|network/i.test(err.message)
    ? "Couldn't reach the assistant. Check your connection and try again."
    : "The assistant is busy right now. The rest of the dashboard still works.";
}

/** Minimal formatting for model text: paragraphs, "- " / "1. " lists, **bold**. */
function RichText({ text }: { text: string }) {
  const bold = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
      seg.startsWith("**") && seg.endsWith("**") ? <strong key={i}>{seg.slice(2, -2)}</strong> : <Fragment key={i}>{seg}</Fragment>,
    );
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter(Boolean);
        if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const items = lines.map((l, j) => <li key={j}>{bold(l.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>);
          return ordered ? (
            <ol key={i} className="list-decimal space-y-1 pl-5">{items}</ol>
          ) : (
            <ul key={i} className="list-disc space-y-1 pl-5">{items}</ul>
          );
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{bold(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}

function loadSaved(): UIMessage[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

/** Strategy assistant chat (spec 008 §3). */
export function AssistantChat() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q")?.trim() ?? "";
  const about = params.get("about")?.trim() ?? "";

  const { messages, sendMessage, regenerate, status, error, setMessages, stop, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  });
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [tick, setTick] = useState(0);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  // First load: auto-send a Generate question, or restore this tab's chat.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (q) {
      sendMessage({ text: q });
      router.replace(about ? `${pathname}?about=${encodeURIComponent(about)}` : pathname, { scroll: false });
    } else {
      const saved = loadSaved();
      if (saved.length) setMessages(saved);
    }
  }, [q, about, pathname, router, sendMessage, setMessages]);

  // Keep the chat for this tab only (no accounts, no saved history).
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {
      /* storage blocked: chat still works */
    }
  }, [messages, busy]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  // Rotating placeholder: pauses on focus, static with reduced motion (003 §5).
  useEffect(() => {
    if (focused || about) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, [focused, about]);
  const placeholder = about ? `Ask about ${about}…` : EXAMPLES[tick % EXAMPLES.length];

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    clearError();
    sendMessage({ text: t });
    setInput("");
  };
  const redo = () => {
    clearError();
    regenerate({ body: { regenerate: true } });
  };

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1 space-y-5" aria-live="polite">
        {messages.length === 0 && !busy && (
          <div className="rounded-[8px] border border-dashed border-border bg-surface-1 p-6 text-sm text-secondary">
            <p>Ask a question in plain English. The assistant looks up your customer data itself and suggests what to do.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.slice(0, 3).map((e) => (
                <li key={e}>
                  <button type="button" onClick={() => send(e)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                    {e}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, mi) => {
          const isLast = mi === messages.length - 1;
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[80%] rounded-[8px] bg-accent px-4 py-2 text-sm text-white">
                  {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
                </p>
              </div>
            );
          }
          return (
            <div key={m.id} className="max-w-3xl space-y-3 text-sm">
              {m.parts.map((p, i) => {
                if (p.type === "text") return p.text.trim() ? <RichText key={i} text={p.text} /> : null;
                if (p.type.startsWith("tool-") && "state" in p) {
                  const name = p.type.slice(5);
                  if (name === "present_strategy" && p.state === "output-available") {
                    return <StrategyCard key={i} plan={p.output as StrategyOutput} onRegenerate={isLast && !busy ? redo : undefined} />;
                  }
                  if (p.state === "input-streaming" || p.state === "input-available") {
                    return (
                      <p key={i} className="text-muted">
                        🔎 {toolStatus(name, p.input as Record<string, unknown> | undefined)}
                      </p>
                    );
                  }
                }
                return null;
              })}
            </div>
          );
        })}

        {status === "submitted" && <p className="text-sm text-muted">Thinking…</p>}

        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[8px] border border-border bg-surface-1 p-4 text-sm">
            <span aria-hidden>⚠️</span>
            <span>{friendlyError(error)}</span>
            {messages.length > 0 && (
              <button type="button" onClick={redo} className="text-accent hover:underline">
                Retry
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-0 mt-6 flex gap-2 border-t border-border bg-surface-0 pt-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">Ask the assistant</label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={1000}
          autoComplete="off"
          className="flex-1 rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-sm"
        />
        {busy ? (
          <button type="button" onClick={() => stop()} className="rounded-[6px] border border-border px-4 py-2 text-sm">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            Send
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            stop();
            clearError();
            setMessages([]);
            setInput("");
          }}
          className="rounded-[6px] border border-border px-3 py-2 text-sm text-secondary"
        >
          New chat
        </button>
      </form>
    </div>
  );
}
