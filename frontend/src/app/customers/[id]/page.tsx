import Link from "next/link";
import { Suspense } from "react";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { InfoTip } from "@/components/info-tip";
import { KpiTile } from "@/components/kpi-tile";
import { SegmentBadge } from "@/components/segment-badge";
import { strategyHref } from "@/components/segment-card";
import { getCustomer, getOverview } from "@/lib/data";
import { daysAgo, money, monthYear, num, pct } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import { getSegment } from "@/lib/segments";
import type { CustomerDetail } from "@/lib/types";

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  return (
    <>
      <Link href="/customers" className="text-sm text-accent hover:underline">
        ← Back to customers
      </Link>
      {/* The ID is only known at request time (Cache Components). */}
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-[8px] bg-surface-1" />}>
        {params.then(({ id }) => (
          <Profile id={id} />
        ))}
      </Suspense>
    </>
  );
}

// Customer profile (spec 006 §3).
async function Profile({ id }: { id: string }) {
  const customer = /^\d+$/.test(id) ? await getCustomer(Number(id)) : null;
  if (!customer) return <NotFound id={id} />;

  const overview = await getOverview();
  const segment = getSegment(customer.segment)!;
  const total = customer.monthly_spend.reduce((s, m) => s + m.spend, 0);
  const busiest = [...customer.monthly_spend].sort((a, b) => b.spend - a.spend)[0];

  return (
    <div className="mt-4">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Customer {customer.id}</h1>
            <Link href={`/segments/${segment.slug}`} className="hover:underline">
              <SegmentBadge segment={segment} />
            </Link>
            {customer.country && <span className="text-sm text-secondary">{customer.country}</span>}
          </div>
          <p className="mt-2 flex items-center gap-2 text-lg">
            <span>
              <strong>{pct(customer.probability)}</strong> chance of buying again in the next 90 days
            </span>
            <InfoTip text={GLOSSARY.chance} label="chance of buying again" />
          </p>
        </div>
        <Link
          href={strategyHref(`Give me a strategy for customer ${customer.id}`)}
          className="rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Generate strategy
        </Link>
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Orders" value={num(customer.invoice_count)} />
        <KpiTile label="Total spend" value={money(customer.total_spend)} />
        <KpiTile label="Average order" value={money(customer.avg_order_value)} info={GLOSSARY.aov} />
        <KpiTile label="Last bought" value={daysAgo(customer.recency_days)} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">What they&apos;re likely to buy next</h2>
        <LikelyNext customer={customer} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Purchase history</h2>
        <MonthlyChart
          data={customer.monthly_spend}
          ariaLabel={`Spent ${money(total)} in total; busiest month ${monthYear(`${busiest.month}-01`)} with ${money(busiest.spend)}.`}
        />
      </section>

      <section className="mt-10">
        <details className="rounded-[8px] border border-border bg-surface-1 p-4">
          <summary className="cursor-pointer text-sm font-medium">More details</summary>
          <MoreDetails customer={customer} scoredAsOf={overview.scored_as_of} />
        </details>
      </section>
    </div>
  );
}

function LikelyNext({ customer }: { customer: CustomerDetail }) {
  const tops = customer.top_categories;
  if (!tops || tops.length === 0) {
    return (
      <p className="rounded-[8px] border border-border bg-surface-1 p-6 text-sm text-secondary">
        Not enough history for category predictions.
      </p>
    );
  }
  const max = Math.max(...tops.map((t) => t.expected_spend), 1);
  return (
    <ol className="space-y-1 rounded-[8px] border border-border bg-surface-1 p-2">
      {tops.map((t) => (
        <li key={t.slug}>
          <Link
            href={`/categories/${t.slug}`}
            className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 rounded-[6px] px-2 py-2 text-sm hover:bg-surface-0 sm:grid-cols-[minmax(0,13rem)_1fr_auto_auto_6.5rem]"
          >
            <span className="truncate">{t.category}</span>
            <span aria-hidden className="h-3.5">
              <span
                className="block h-full rounded-r-[4px] bg-accent"
                style={{ width: `${Math.max((t.expected_spend / max) * 100, 2)}%` }}
              />
            </span>
            <span className="text-right tabular-nums" title="Chance to buy this category">
              {pct(t.buy_probability)}
            </span>
            <span className="hidden text-right text-secondary tabular-nums sm:inline" title={GLOSSARY.expectedSpend}>
              {money(t.expected_spend)}
            </span>
            <span
              className={`hidden justify-self-end rounded-full px-2 py-0.5 text-[11px] sm:inline ${
                t.already_buys ? "bg-accent/15 text-accent" : "bg-surface-0 text-secondary"
              }`}
            >
              {t.already_buys ? "Already buys" : "New"}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function MoreDetails({ customer, scoredAsOf }: { customer: CustomerDetail; scoredAsOf: string }) {
  const f = customer.features;
  const since =
    f.customer_age_days != null
      ? monthYear(new Date(Date.parse(scoredAsOf) - f.customer_age_days * 86_400_000).toISOString())
      : "—";
  const gap =
    customer.invoice_count <= 1 || !f.mean_order_gap_days
      ? "Only one order"
      : `${num(f.mean_order_gap_days)} days`;
  const items: [string, string][] = [
    ["Customer since", since],
    ["Items bought", f.total_items != null ? num(f.total_items) : "—"],
    ["Different products", f.unique_products != null ? num(f.unique_products) : "—"],
    ["Average days between orders", gap],
    ["Products bought more than once", f.repeat_purchase_rate != null ? pct(f.repeat_purchase_rate) : "—"],
  ];
  return (
    <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold">No customer with ID {id}.</h1>
      <form action="/customers" className="mt-4 flex gap-2">
        <label htmlFor="nf-search" className="sr-only">Find a customer by ID</label>
        <input
          id="nf-search"
          name="q"
          inputMode="numeric"
          placeholder="Find a customer by ID…"
          className="w-full max-w-xs rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>
    </div>
  );
}
