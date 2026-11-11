"use client";

import type { UIMessage } from "ai";
import Link from "next/link";
import { type AssistantMetadata, CITATION_RE, citationIds, type Source } from "@/lib/assistant/sources";

/**
 * Every source the assistant had in front of it up to and including message
 * `upTo`: tool results (each carries a `source`) plus the ones the server sent
 * as metadata. A citation is only "verified" if its id is in here.
 */
export function knownSources(messages: UIMessage[], upTo: number): Map<string, Source> {
  const known = new Map<string, Source>();
  const add = (s: unknown) => {
    if (s && typeof s === "object" && "id" in s && "label" in s && "href" in s) {
      const src = s as Source;
      known.set(src.id, src);
    }
  };
  for (const m of messages.slice(0, upTo + 1)) {
    if (m.role !== "assistant") continue;
    (m.metadata as AssistantMetadata | undefined)?.sources?.forEach(add);
    for (const p of m.parts) {
      if (p.type.startsWith("tool-") && "state" in p && p.state === "output-available") {
        const out = (p as { output?: unknown }).output;
        if (out && typeof out === "object" && "source" in out) add(out.source);
      }
    }
  }
  return known;
}

export interface Citations {
  /** Cited sources that exist, numbered in order of first use (1-based). */
  cited: Source[];
  number: Map<string, number>;
  /** Cited ids that match nothing the assistant looked up. */
  unverified: string[];
}

export function numberCitations(texts: string[], known: Map<string, Source>): Citations {
  const cited: Source[] = [];
  const number = new Map<string, number>();
  const unverified: string[] = [];
  for (const text of texts) {
    const pieces = text.split(new RegExp(CITATION_RE, "g"));
    for (let i = 1; i < pieces.length; i += 2) {
      for (const id of citationIds(pieces[i])) {
        const src = known.get(id);
        if (src && !number.has(id)) {
          cited.push(src);
          number.set(id, cited.length);
        } else if (!src && !unverified.includes(id)) {
          unverified.push(id);
        }
      }
    }
  }
  return { cited, number, unverified };
}

/** Inline marker for one [..] citation: numbered links, or a warning for unknown ids. */
export function CitationMarks({ inner, citations }: { inner: string; citations: Citations }) {
  return (
    <sup className="ml-0.5 whitespace-nowrap">
      {citationIds(inner).map((id) => {
        const n = citations.number.get(id);
        const src = n ? citations.cited[n - 1] : undefined;
        return src ? (
          <Link
            key={id}
            href={src.href}
            title={`Source: ${src.label}`}
            className="mx-px rounded-[3px] bg-surface-0 px-1 text-[0.7rem] font-medium text-accent hover:underline"
          >
            {n}
          </Link>
        ) : (
          <span
            key={id}
            title={`"${id}" doesn't match any data the assistant looked up. Treat this claim as unverified.`}
            className="mx-px rounded-[3px] bg-surface-0 px-1 text-[0.7rem] font-medium text-warning"
          >
            ?
          </span>
        );
      })}
    </sup>
  );
}

/** "Sources" list under an answer, plus warnings when citations are missing or don't check out. */
export function SourceList({ citations, uncited }: { citations: Citations; uncited: boolean }) {
  const { cited, unverified } = citations;
  return (
    <div className="space-y-1 border-t border-border pt-2 text-xs text-secondary">
      {cited.length > 0 && (
        <ol className="space-y-0.5" aria-label="Sources">
          {cited.map((s, i) => (
            <li key={s.id}>
              <span className="text-muted">[{i + 1}]</span>{" "}
              <Link href={s.href} className="text-accent hover:underline">
                {s.label}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {unverified.length > 0 && (
        <p role="note" className="text-warning">
          ⚠️ Cites data the assistant never looked up ({unverified.join(", ")}). Check those claims on the dashboard.
        </p>
      )}
      {uncited && (
        <p role="note">⚠️ This answer doesn&apos;t cite any of your data. Check it on the dashboard before acting on it.</p>
      )}
    </div>
  );
}

/** Split text on citations and render each with `CitationMarks`. */
export function withCitations(text: string, citations: Citations, keyPrefix: string) {
  const pieces = text.split(new RegExp(CITATION_RE, "g"));
  return pieces.map((piece, i) =>
    i % 2 === 1 ? (
      <CitationMarks key={`${keyPrefix}-c${i}`} inner={piece} citations={citations} />
    ) : (
      // "customers [x]." reads as "customers¹."
      i + 1 < pieces.length ? piece.trimEnd() : piece
    ),
  );
}
