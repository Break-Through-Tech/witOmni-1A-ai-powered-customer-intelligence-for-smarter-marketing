import Link from "next/link";
import { notFound } from "next/navigation";
import { HBarChart, type HBarRow } from "@/components/charts/hbar-chart";
import { CompareBars } from "@/components/charts/compare-bars";
import { CustomerList } from "@/components/customer-list";
import { KpiTile } from "@/components/kpi-tile";
import { SegmentBadge } from "@/components/segment-badge";
import { strategyHref } from "@/components/segment-card";
import { SegmentTabs } from "@/components/segment-tabs";
import { comparisonTakeaway } from "@/lib/compare";
import { getCustomers, getSegments } from "@/lib/data";
import { daysAgo, money, moneyShort, num, pct } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import { getSegment, SEGMENTS } from "@/lib/segments";
import type { SegmentMedians } from "@/lib/types";

export function generateStaticParams() {
  return SEGMENTS.map((s) => ({ slug: s.slug }));
}

const MEASURES: {
  key: keyof SegmentMedians;
  title: string;
  format: (v: number) => string;
}[] = [
  { key: "invoice_count", title: "Orders", format: (v) => num(v) },
  { key: "total_spend", title: "Total spend", format: money },
  { key: "avg_order_value", title: "Order value", format: money },
  { key: "recency_days", title: "Days since last purchase", format: (v) => num(v) },
];

// Segment page (spec 005).
export default async function SegmentPage({ params }: PageProps<"/segments/[slug]">) {
  const { slug } = await params;
  const segment = getSegment(slug);
  if (!segment || segment.slug !== slug) notFound();

  const [segments, customers] = await Promise.all([getSegments(), getCustomers()]);
  const stats = segments.find((s) => s.slug === segment.slug);
  if (!stats) notFound();

  const rows = customers
    .filter((c) => c.segment === segment.slug)
    .sort((a, b) => b.probability - a.probability || a.id - b.id);

  const takeaway = comparisonTakeaway(segment.name, stats.medians, stats.all_customers_medians);

  const categoryRows: HBarRow[] = stats.top_categories.map((c) => ({
    key: c.slug,
    label: c.category,
    value: c.expected_spend,
    valueLabel: money(c.expected_spend),
    details: [`${num(c.likely_buyers)} likely buyers in this segment`],
    href: `/categories/${c.slug}?segment=${segment.slug}`,
  }));

  return (
    <>
      <SegmentTabs active={segment.slug} />

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <SegmentBadge segment={segment} />
          </h1>
          <p className="mt-2 text-secondary">{segment.description}</p>
          <p className="mt-1 text-sm text-muted">
            How customers get here: {segment.rule}.
          </p>
        </div>
        <Link
          href={`/assistant?about=${encodeURIComponent(segment.name)}`}
          className="rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Ask assistant
        </Link>
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Customers"
          value={num(stats.customers)}
          context={`${pct(stats.customer_share)} of all customers`}
        />
        <KpiTile
          label="Revenue"
          value={moneyShort(stats.revenue)}
          context={`${pct(stats.revenue_share)} of all revenue`}
        />
        <KpiTile
          label="Chance of buying again"
          value={pct(stats.avg_probability)}
          context="average in the next 90 days"
          info={GLOSSARY.chance}
        />
        <KpiTile
          label="Last bought"
          value={daysAgo(stats.medians.recency_days)}
          context="typical customer"
        />
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-border bg-surface-1 p-5">
        <div>
          <h2 className="text-xs text-muted">Recommended action</h2>
          <p className="mt-1">{segment.action}</p>
        </div>
        <Link
          href={strategyHref(`Give me a strategy for my ${segment.name} customers`)}
          className="rounded-[6px] border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-white"
        >
          Generate strategy
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">How they compare to all customers</h2>
        {takeaway && <p className="mt-1 text-sm text-secondary">{takeaway}</p>}
        <p className="mt-1 text-xs text-muted">Typical (median) customer.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MEASURES.map((m) => {
            const seg = stats.medians[m.key];
            const all = stats.all_customers_medians[m.key];
            return (
              <CompareBars
                key={m.key}
                title={m.title}
                rows={[
                  {
                    label: segment.name,
                    value: seg,
                    valueLabel: m.format(seg),
                    color: `var(--seg-${segment.slug})`,
                  },
                  {
                    label: "All customers",
                    value: all,
                    valueLabel: m.format(all),
                    color: "var(--neutral-bar)",
                  },
                ]}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">What they&apos;re likely to buy</h2>
          <Link href="/categories" className="text-sm text-accent hover:underline">
            See in Categories →
          </Link>
        </div>
        {categoryRows.length > 0 ? (
          <HBarChart
            title="Top 5 categories by estimated spend in the next 90 days"
            rows={categoryRows}
            valueHeader="Expected spend"
            labelWidth={190}
            ariaLabel={`${segment.name} are most likely to spend on ${categoryRows[0].label}.`}
          />
        ) : (
          <p className="text-sm text-secondary">Not enough history for category predictions.</p>
        )}
        <div className="mt-2 space-y-1 text-sm text-secondary">
          {stats.leans.length > 0 && (
            <p>
              Leans toward{" "}
              {stats.leans
                .map((l) => `${l.category} (+${Math.round((l.lean - 1) * 100)}% vs. average)`)
                .join(" and ")}
              .
            </p>
          )}
          {stats.no_category_scores > 0 && (
            <p className="text-xs text-muted">
              {num(stats.no_category_scores)}{" "}
              {stats.no_category_scores === 1 ? "customer" : "customers"} in this segment
              {stats.no_category_scores === 1 ? " doesn't" : " don't"} have enough history for
              category predictions.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Customers in this segment</h2>
        <CustomerList
          rows={rows}
          noun={segment.name}
          showSegment={false}
          exportName={segment.slug}
        />
      </section>
    </>
  );
}
