"use client";

import Link from "next/link";
import { useState } from "react";
import { money, num } from "@/lib/format";
import type { CategorySummary } from "@/lib/types";
import { HBarChart } from "./charts/hbar-chart";

const TOP = 10;
const BOTTOM = 5;

/** "Biggest opportunities": top 10, expandable to all 27 (007 §2.2). */
export function BiggestOpportunities({ categories }: { categories: CategorySummary[] }) {
  const [all, setAll] = useState(false);
  const sorted = [...categories].sort((a, b) => b.expected_spend - a.expected_spend);
  const rows = (all ? sorted : sorted.slice(0, TOP)).map((c) => ({
    key: c.slug,
    label: c.name,
    value: c.expected_spend,
    valueLabel: money(c.expected_spend),
    details: [
      `${num(c.likely_buyers)} likely buyers`,
      `${num(c.buyers)} current buyers`,
      `${money(c.revenue)} past revenue`,
    ],
    href: `/categories/${c.slug}`,
  }));
  return (
    <div>
      <HBarChart
        title="Estimated spend in the next 90 days"
        rows={rows}
        valueHeader="Expected spend"
        labelWidth={240}
        ariaLabel={`${rows[0].label} has the biggest opportunity at ${rows[0].valueLabel}.`}
      />
      {sorted.length > TOP && (
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          className="mt-2 text-sm text-accent hover:underline"
        >
          {all ? `Show top ${TOP}` : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

/** "Categories to grow": bottom 5 by buyers or revenue (007 §2.3). */
export function CategoriesToGrow({ categories }: { categories: CategorySummary[] }) {
  const [by, setBy] = useState<"buyers" | "revenue">("buyers");
  const rank = by === "buyers" ? "rank_by_buyers" : "rank_by_revenue";
  const bottom = [...categories].sort((a, b) => a[rank] - b[rank]).slice(0, BOTTOM);

  return (
    <div className="rounded-[8px] border border-border bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div role="group" aria-label="Rank by" className="inline-flex rounded-[6px] border border-border p-0.5 text-sm">
          {(["buyers", "revenue"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={by === k}
              onClick={() => setBy(k)}
              className={`rounded-[4px] px-3 py-1 ${by === k ? "bg-accent text-white" : "text-secondary hover:text-primary"}`}
            >
              {k === "buyers" ? "Fewest buyers" : "Least revenue"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">The {BOTTOM} weakest categories</p>
      </div>
      <ul>
        {bottom.map((c) => (
          <li key={c.slug} className="border-b border-border last:border-0">
            <Link
              href={`/categories/${c.slug}`}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm hover:bg-surface-0"
            >
              <span className="flex items-center gap-2 font-medium">
                {c.name}
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-normal text-secondary">
                  Needs a boost
                </span>
              </span>
              <span className="flex flex-wrap gap-x-6 text-secondary">
                <span className={by === "buyers" ? "font-medium text-primary" : ""}>
                  {num(c.buyers)} buyers
                </span>
                <span className={by === "revenue" ? "font-medium text-primary" : ""}>
                  {money(c.revenue)} revenue
                </span>
                <span>{num(c.likely_buyers)} likely buyers</span>
                <span aria-hidden>›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-2 text-xs text-muted">
        Few likely buyers means a broad campaign may work better than a targeted list.
      </p>
    </div>
  );
}
