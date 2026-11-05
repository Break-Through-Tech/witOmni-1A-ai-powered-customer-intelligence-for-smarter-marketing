import { BiggestOpportunities, CategoriesToGrow } from "@/components/category-overview";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { getCategories, getOverview } from "@/lib/data";
import { EARLIER_WINDOW_NOTE, GLOSSARY } from "@/lib/glossary";

// All categories page (spec 007 §2).
export default async function CategoriesPage() {
  const [categories, overview] = await Promise.all([getCategories(), getOverview()]);
  const tip = overview.category_scores_current
    ? GLOSSARY.categoryOpportunity
    : `${GLOSSARY.categoryOpportunity} ${EARLIER_WINDOW_NOTE}`;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="What your customers are likely to buy next (estimated, 90 days)"
      />

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          Biggest opportunities <InfoTip text={tip} label="estimated spend" />
        </h2>
        <BiggestOpportunities categories={categories} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Categories to grow</h2>
        <CategoriesToGrow categories={categories} />
      </section>
    </>
  );
}
