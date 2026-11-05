import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryTargets } from "@/components/category-targets";
import { KpiTile } from "@/components/kpi-tile";
import { strategyHref } from "@/components/segment-card";
import { getCategories, getCategory, getOverview } from "@/lib/data";
import { money, moneyShort, num } from "@/lib/format";
import { EARLIER_WINDOW_NOTE, GLOSSARY } from "@/lib/glossary";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

// One category page (spec 007 §3).
export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const [categories, detail, overview] = await Promise.all([
    getCategories(),
    getCategory(slug),
    getOverview(),
  ]);
  const summary = categories.find((c) => c.slug === slug);
  if (!summary || !detail) notFound();

  const spendTip = overview.category_scores_current
    ? GLOSSARY.expectedSpend
    : `${GLOSSARY.expectedSpend} ${EARLIER_WINDOW_NOTE}`;

  return (
    <>
      <Link href="/categories" className="text-sm text-accent hover:underline">
        ← All categories
      </Link>
      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{summary.name}</h1>
        <Link
          href={strategyHref(`Give me a campaign for ${summary.name}`)}
          className="rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Generate campaign
        </Link>
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Buyers" value={num(summary.buyers)} context="bought it at least once" />
        <KpiTile label="Past revenue" value={moneyShort(summary.revenue)} context={money(summary.revenue)} />
        <KpiTile
          label="Likely buyers"
          value={num(summary.likely_buyers)}
          context="50%+ chance in the next 90 days"
        />
        <KpiTile
          label="Expected spend"
          value={moneyShort(summary.expected_spend)}
          context="estimated, next 90 days"
          info={spendTip}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Who to target</h2>
        {/* Tab and segment filter come from the URL (request time). */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-[8px] bg-surface-1" />}>
          <CategoryTargets detail={detail} />
        </Suspense>
      </section>
    </>
  );
}
