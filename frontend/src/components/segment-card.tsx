import Link from "next/link";
import { daysAgo, num, pct } from "@/lib/format";
import type { Segment } from "@/lib/segments";
import type { SegmentStats } from "@/lib/types";
import { SegmentBadge } from "./segment-badge";

export function strategyHref(question: string) {
  return `/assistant?q=${encodeURIComponent(question)}`;
}

/** Segment card (003 §5, 004 §3.3). */
export function SegmentCard({
  segment,
  stats,
}: {
  segment: Segment;
  stats: SegmentStats;
}) {
  const orders = stats.medians.invoice_count;
  return (
    <article className="flex flex-col rounded-[8px] border border-border bg-surface-1 p-5">
      <Link
        href={`/segments/${segment.slug}`}
        className="self-start hover:underline"
      >
        <SegmentBadge segment={segment} />
      </Link>
      <p className="mt-2 text-sm text-secondary">{segment.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Customers</dt>
          <dd className="font-medium">
            {num(stats.customers)}{" "}
            <span className="text-muted">({pct(stats.customer_share)})</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Share of revenue</dt>
          <dd className="font-medium">{pct(stats.revenue_share)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Typical customer</dt>
          <dd className="font-medium">
            {pct(stats.avg_probability)} chance of buying again ·{" "}
            {num(orders)} {orders === 1 ? "order" : "orders"} · last bought{" "}
            {daysAgo(stats.medians.recency_days)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <div className="text-xs text-muted">Recommended action</div>
        <p className="mt-1 text-sm">{segment.action}</p>
      </div>

      <Link
        href={strategyHref(`Give me a strategy for my ${segment.name} customers`)}
        className="mt-4 self-start rounded-[6px] border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-white"
      >
        Generate strategy
      </Link>
    </article>
  );
}
