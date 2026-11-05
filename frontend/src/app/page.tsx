import Link from "next/link";
import { HBarChart, type HBarRow } from "@/components/charts/hbar-chart";
import { KpiTile } from "@/components/kpi-tile";
import { LimitationNote } from "@/components/limitation-note";
import { PageHeader } from "@/components/page-header";
import { SegmentCard } from "@/components/segment-card";
import {
  getCategories,
  getModelMetrics,
  getOverview,
  getSegments,
} from "@/lib/data";
import { money, moneyShort, monthYear, num, pct } from "@/lib/format";
import { EARLIER_WINDOW_NOTE, GLOSSARY } from "@/lib/glossary";
import { SEGMENTS } from "@/lib/segments";

// Overview page (spec 004).
export default async function OverviewPage() {
  const [overview, segments, categories, metrics] = await Promise.all([
    getOverview(),
    getSegments(),
    getCategories(),
    getModelMetrics(),
  ]);
  const { start, end } = overview.data_range;
  const stats = new Map(segments.map((s) => [s.slug, s]));
  const atRiskShare =
    overview.segments.find((s) => s.slug === "at-risk-lapsed")?.revenue_share ?? 0;
  const { scoring_model, final_model } = metrics.repeat_purchase;

  // Fixed segment order (003 §3), names always visible.
  const customerRows: HBarRow[] = SEGMENTS.map((seg) => {
    const s = stats.get(seg.slug)!;
    return {
      key: seg.slug,
      label: seg.name,
      value: s.customers,
      valueLabel: num(s.customers),
      details: [`${pct(s.customer_share)} of customers`],
      color: `var(--seg-${seg.slug})`,
      href: `/segments/${seg.slug}`,
    };
  });
  const revenueRows: HBarRow[] = SEGMENTS.map((seg) => {
    const s = stats.get(seg.slug)!;
    return {
      key: seg.slug,
      label: seg.name,
      value: s.revenue,
      valueLabel: `${moneyShort(s.revenue)} · ${pct(s.revenue_share)}`,
      details: [`${money(s.revenue)} total`, `${pct(s.revenue_share)} of revenue`],
      color: `var(--seg-${seg.slug})`,
      href: `/segments/${seg.slug}`,
    };
  });
  const topCategories: HBarRow[] = [...categories]
    .sort((a, b) => b.expected_spend - a.expected_spend)
    .slice(0, 5)
    .map((c) => ({
      key: c.slug,
      label: c.name,
      value: c.expected_spend,
      valueLabel: money(c.expected_spend),
      details: [`${num(c.likely_buyers)} likely buyers`],
      href: `/categories/${c.slug}`,
    }));

  const focus = SEGMENTS.filter((s) => s.focus);
  const biggestCustomers = [...customerRows].sort((a, b) => b.value - a.value)[0];
  const biggestRevenue = [...revenueRows].sort((a, b) => b.value - a.value)[0];

  return (
    <>
      <PageHeader
        title="Your customers at a glance"
        subtitle={`Based on purchases ${monthYear(start)} – ${monthYear(end)} · predictions for the next 90 days`}
      />

      {scoring_model !== final_model && (
        <LimitationNote>
          Scores currently from {scoring_model}; final model is {final_model}.
        </LimitationNote>
      )}

      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <KpiTile
          label="Customers"
          value={num(overview.total_customers)}
          context="with purchase history"
          href="/customers"
          info={GLOSSARY.customers}
        />
        <KpiTile
          label="Likely to buy again"
          value={pct(overview.likely_to_repeat_pct)}
          context="chance ≥ 50% in the next 90 days"
          href="/customers?chance=high,medium"
          info={GLOSSARY.chance}
        />
        <KpiTile
          label="Revenue at risk"
          value={moneyShort(overview.revenue_at_risk)}
          context={`past spend of At-risk / lapsed customers (${pct(atRiskShare)})`}
          href="/segments/at-risk-lapsed"
          info={GLOSSARY.revenueAtRisk}
        />
        <KpiTile
          label="Category opportunity"
          value={moneyShort(overview.expected_category_spend)}
          context="estimated spend across all categories"
          href="/categories"
          info={
            overview.category_scores_current
              ? GLOSSARY.categoryOpportunity
              : `${GLOSSARY.categoryOpportunity} ${EARLIER_WINDOW_NOTE}`
          }
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Where to focus</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {focus.map((seg) => (
            <SegmentCard key={seg.slug} segment={seg} stats={stats.get(seg.slug)!} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Segments</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <HBarChart
            title="Customers per segment"
            rows={customerRows}
            valueHeader="Customers"
            ariaLabel={`${biggestCustomers.label} is the largest segment with ${biggestCustomers.valueLabel} customers.`}
          />
          <HBarChart
            title="Revenue per segment"
            rows={revenueRows}
            valueHeader="Revenue · share"
            ariaLabel={`${biggestRevenue.label} bring in the most revenue: ${biggestRevenue.valueLabel}.`}
          />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Top category opportunities</h2>
          <Link href="/categories" className="text-sm text-accent hover:underline">
            See all categories →
          </Link>
        </div>
        <HBarChart
          title="Estimated spend in the next 90 days"
          rows={topCategories}
          valueHeader="Expected spend"
          labelWidth={190}
          ariaLabel={`${topCategories[0].label} has the biggest opportunity at ${topCategories[0].valueLabel}.`}
        />
      </section>
    </>
  );
}
