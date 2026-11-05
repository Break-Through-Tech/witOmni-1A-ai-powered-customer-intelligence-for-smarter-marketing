import { ComingSoon, PageHeader } from "@/components/page-header";

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="What your customers are likely to buy next (estimated, 90 days)"
      />
      <ComingSoon spec="007" />
    </>
  );
}
