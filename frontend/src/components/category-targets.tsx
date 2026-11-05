"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { daysAgo, money, num, pct } from "@/lib/format";
import { getSegment, SEGMENTS } from "@/lib/segments";
import type { CategoryDetail, CategoryListRow } from "@/lib/types";
import { SegmentBadge } from "./segment-badge";

const PAGE = 25;
const THIN = 20;
const CAP = 500;

type Tab = "new" | "existing";

/** Target lists for one category (007 §3.2). Tab + segment live in the URL. */
export function CategoryTargets({ detail }: { detail: CategoryDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "existing" ? "existing" : "new";
  const segParam = params.get("segment") ?? "";
  const segment = getSegment(segParam);

  const set = (patch: { tab?: Tab; segment?: string }) => {
    const p = new URLSearchParams(params.toString());
    if (patch.tab !== undefined) {
      if (patch.tab === "new") p.delete("tab");
      else p.set("tab", patch.tab);
    }
    if (patch.segment !== undefined) {
      if (patch.segment) p.set("segment", patch.segment);
      else p.delete("segment");
    }
    const s = p.toString();
    router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  };

  const list = tab === "new" ? detail.likely_new_buyers : detail.existing_buyers;
  const total = tab === "new" ? detail.likely_new_total : detail.existing_total;
  const rows = segment ? list.filter((r) => r.segment === segment.slug) : list;
  // With a segment filter we can only count within the stored top 500.
  const count = segment ? rows.length : total;
  const capped = segment && total > CAP;

  const who =
    tab === "new"
      ? `${segment ? `${segment.name} ` : ""}customers who haven't bought ${detail.name} yet`
      : `${segment ? `${segment.name} ` : ""}customers who already buy ${detail.name}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Target list" className="inline-flex rounded-[6px] border border-border p-0.5 text-sm">
          {(
            [
              ["new", `Likely new buyers (${num(detail.likely_new_total)})`],
              ["existing", `Already buy it (${num(detail.existing_total)})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => set({ tab: k })}
              className={`rounded-[4px] px-3 py-1 ${tab === k ? "bg-accent text-white" : "text-secondary hover:text-primary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-secondary">Segment</span>
          <select
            value={segment?.slug ?? ""}
            onChange={(e) => set({ segment: e.target.value })}
            className="rounded-[6px] border border-border bg-surface-1 px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            {SEGMENTS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-3 text-sm text-secondary">
        {tab === "new"
          ? "Never bought this category, with at least a 30% chance to buy it. Good for cross-selling."
          : "Already bought this category at least once. Good for selling more."}
      </p>

      {tab === "new" && !segment && total < THIN ? (
        <div className="rounded-[8px] border border-border bg-surface-1 p-6 text-sm text-secondary">
          Only {num(total)} {total === 1 ? "customer looks" : "customers look"} likely to try{" "}
          {detail.name}. A broad campaign may work better than a targeted list.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[8px] border border-border bg-surface-1 p-6 text-sm text-secondary">
          No {segment?.name ?? ""} customers in this list.{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => set({ segment: "" })}>
            Show all segments
          </button>
        </div>
      ) : (
        <TargetList
          key={`${tab}-${segment?.slug ?? ""}`}
          rows={rows}
          count={count}
          who={capped ? `${who} (among the top ${CAP})` : who}
          exportName={`${detail.slug}-${tab === "new" ? "likely-new-buyers" : "existing-buyers"}${segment ? `-${segment.slug}` : ""}`}
        />
      )}
    </div>
  );
}

function TargetList({
  rows,
  count,
  who,
  exportName,
}: {
  rows: CategoryListRow[];
  count: number;
  who: string;
  exportName: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);
  return (
    <div className="rounded-[8px] border border-border bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm text-secondary" aria-live="polite">
          Showing the top {num(visible.length)} of {num(count)} {who}
        </p>
        <button
          type="button"
          onClick={() => downloadCsv(rows, exportName)}
          className="rounded-[6px] border border-border px-3 py-1.5 text-sm hover:border-accent"
        >
          Export list
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th scope="col" className="px-4 py-2 font-normal">Customer</th>
              <th scope="col" className="px-4 py-2 font-normal">Segment</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Chance to buy this category</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Expected spend</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Last bought</th>
              <th scope="col" className="w-8 px-2 py-2"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const seg = getSegment(r.segment);
              return (
                <tr key={r.id} className="relative border-b border-border last:border-0 hover:bg-surface-0">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${r.id}`} className="font-medium after:absolute after:inset-0 after:content-['']">
                      {r.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{seg && <SegmentBadge segment={seg} showFocus={false} />}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{pct(r.buy_probability)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(r.expected_spend)}</td>
                  <td className="px-4 py-2 text-right text-secondary">{daysAgo(r.recency_days)}</td>
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

function downloadCsv(rows: CategoryListRow[], name: string) {
  const header = "customer_id,segment,chance_to_buy_category_pct,expected_spend_gbp,days_since_last_purchase";
  const lines = rows.map((r) =>
    [r.id, `"${getSegment(r.segment)?.name ?? r.segment}"`, Math.round(r.buy_probability * 100), r.expected_spend, r.recency_days].join(","),
  );
  const url = URL.createObjectURL(new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
