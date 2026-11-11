"use client";

import Link from "next/link";
import { useState } from "react";
import type { Source } from "@/lib/assistant/sources";
import { num } from "@/lib/format";
import { getSegment } from "@/lib/segments";
import { SegmentBadge } from "../segment-badge";

export interface StrategyOutput {
  objective: string;
  channel: string;
  offer: string;
  message_angle: string;
  timing: string;
  success_metric: string;
  draft_subject: string;
  draft_body: string;
  audience_key: string;
  audience: { type: string; label: string; count: number; href: string; segment?: string } | null;
  /** source.ids the model says the plan relies on (checked against `known`). */
  sources?: string[];
}

function asText(s: StrategyOutput) {
  return [
    `Audience: ${s.audience ? `${s.audience.label} (${num(s.audience.count)} ${s.audience.count === 1 ? "customer" : "customers"})` : s.audience_key}`,
    `Objective: ${s.objective}`,
    `Channel: ${s.channel}`,
    `Offer: ${s.offer}`,
    `Message: ${s.message_angle}`,
    `Timing: ${s.timing}`,
    `Measure: ${s.success_metric}`,
    ...(s.sources?.length ? [`Based on: ${s.sources.join(", ")}`] : []),
    "",
    `Subject: ${s.draft_subject}`,
    "",
    s.draft_body,
  ].join("\n");
}

/** Strategy card (003 §5, 008 §3, §7). */
export function StrategyCard({
  plan,
  known,
  onRegenerate,
}: {
  plan: StrategyOutput;
  /** Sources the assistant actually looked up; anything else is flagged. */
  known: Map<string, Source>;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const ids = [...new Set(plan.sources ?? [])];
  const cited = ids.flatMap((id) => (known.has(id) ? [known.get(id)!] : []));
  const unverified = ids.filter((id) => !known.has(id));
  const seg = plan.audience?.segment ? getSegment(plan.audience.segment) : undefined;
  const rows: [string, string][] = [
    ["Objective", plan.objective],
    ["Channel", plan.channel],
    ["Offer", plan.offer],
    ["Message", plan.message_angle],
    ["Timing", plan.timing],
    ["Measure", plan.success_metric],
  ];

  return (
    <article className="rounded-[8px] border border-border bg-surface-1 p-5" aria-label="Strategy">
      <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Strategy</h3>
      <dl className="mt-3 grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">Audience</dt>
        <dd>
          {plan.audience ? (
            <Link href={plan.audience.href} className="inline-flex flex-wrap items-center gap-x-2 hover:underline">
              {seg && plan.audience.type === "segment" ? <SegmentBadge segment={seg} /> : <span className="font-medium">{plan.audience.label}</span>}
              <span className="text-secondary">
                · {num(plan.audience.count)} {plan.audience.count === 1 ? "customer" : "customers"} ›
              </span>
            </Link>
          ) : (
            plan.audience_key
          )}
        </dd>
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <dt className="text-muted">Based on</dt>
        <dd className="space-y-1">
          {cited.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {cited.map((s) => (
                <li key={s.id}>
                  <Link href={s.href} className="text-accent hover:underline">
                    {s.label} ›
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {unverified.length > 0 && (
            <p role="note" className="text-xs text-warning">
              ⚠️ Cites data the assistant never looked up ({unverified.join(", ")}). Check this plan on the dashboard.
            </p>
          )}
          {ids.length === 0 && (
            <p role="note" className="text-xs text-secondary">
              ⚠️ No data cited. Check this plan on the dashboard before acting on it.
            </p>
          )}
        </dd>
      </dl>

      <details className="mt-4 rounded-[6px] border border-border bg-surface-0 p-3">
        <summary className="cursor-pointer text-sm font-medium">Draft email</summary>
        <p className="mt-3 text-sm">
          <span className="text-muted">Subject: </span>
          {plan.draft_subject}
        </p>
        <p className="mt-2 text-sm whitespace-pre-wrap">{plan.draft_body}</p>
      </details>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(asText(plan));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked: nothing to do */
            }
          }}
          className="rounded-[6px] border border-border px-3 py-1.5 text-sm hover:border-accent"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-[6px] border border-border px-3 py-1.5 text-sm hover:border-accent"
          >
            Regenerate
          </button>
        )}
      </div>
    </article>
  );
}
