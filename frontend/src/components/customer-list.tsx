"use client";

import Link from "next/link";
import { useState } from "react";
import { daysAgo, money, num, pct } from "@/lib/format";
import { getSegment } from "@/lib/segments";
import type { CustomerRow } from "@/lib/types";
import { SegmentBadge } from "./segment-badge";

const PAGE = 25;

/**
 * Short customer list (006 §2): top 25, "Show 25 more", 5 columns,
 * plain-words summary line, CSV export of every row (not just shown ones).
 * Rows arrive already sorted.
 */
export function CustomerList({
  rows,
  noun = "customers",
  showSegment = true,
  exportName,
}: {
  rows: CustomerRow[];
  /** e.g. "Occasional regulars" → "Showing the top 25 of 1,480 Occasional regulars". */
  noun?: string;
  showSegment?: boolean;
  exportName: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);

  return (
    <div className="rounded-[8px] border border-border bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm text-secondary" aria-live="polite">
          {rows.length === 0
            ? `No ${noun} to show.`
            : `Showing the top ${num(visible.length)} of ${num(rows.length)} ${noun}`}
        </p>
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() => downloadCsv(rows, exportName)}
          className="rounded-[6px] border border-border px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
        >
          Export list
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th scope="col" className="px-4 py-2 font-normal">Customer</th>
              {showSegment && (
                <th scope="col" className="px-4 py-2 font-normal">Segment</th>
              )}
              <th scope="col" className="px-4 py-2 font-normal">Chance of buying again</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Total spend</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Last bought</th>
              <th scope="col" className="w-8 px-2 py-2"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const seg = getSegment(c.segment);
              return (
                <tr key={c.id} className="relative border-b border-border last:border-0 hover:bg-surface-0">
                  <td className="px-4 py-2">
                    {/* Stretched link: the whole row opens the profile. */}
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium after:absolute after:inset-0 after:content-['']"
                    >
                      {c.id}
                    </Link>
                  </td>
                  {showSegment && (
                    <td className="px-4 py-2">{seg && <SegmentBadge segment={seg} showFocus={false} />}</td>
                  )}
                  <td className="px-4 py-2">
                    <ProbabilityBar value={c.probability} />
                  </td>
                  <td className="px-4 py-2 text-right">{money(c.total_spend)}</td>
                  <td className="px-4 py-2 text-right text-secondary">{daysAgo(c.recency_days)}</td>
                  <td className="px-2 py-2 text-muted" aria-hidden>›</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shown < rows.length && (
        <div className="border-t border-border p-3 text-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE)}
            className="rounded-[6px] border border-border px-4 py-1.5 text-sm hover:border-accent"
          >
            Show {Math.min(PAGE, rows.length - shown)} more
          </button>
        </div>
      )}
    </div>
  );
}

/** "72%" + thin bar (003 §5 Probability display). */
export function ProbabilityBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2" title="Chance this customer buys again in the next 90 days">
      <span className="w-9 tabular-nums">{pct(value)}</span>
      <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-0">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${value * 100}%` }} />
      </span>
    </span>
  );
}

function csvCell(v: string | number | null): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(rows: CustomerRow[], name: string) {
  const header = [
    "customer_id",
    "segment",
    "chance_of_buying_again_pct",
    "orders",
    "total_spend_gbp",
    "average_order_value_gbp",
    "days_since_last_purchase",
    "country",
    "top_category",
  ];
  const lines = rows.map((c) =>
    [
      c.id,
      getSegment(c.segment)?.name ?? c.segment,
      Math.round(c.probability * 100),
      c.invoice_count,
      c.total_spend,
      c.avg_order_value,
      c.recency_days,
      c.country,
      c.top_category ?? "Not enough history",
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
