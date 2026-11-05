import { Suspense } from "react";
import { ComingSoon, PageHeader } from "@/components/page-header";

export default function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      {params.then(({ slug }) => (
        <>
          <PageHeader title={slug} askAbout={slug} />
          <ComingSoon spec="007" />
        </>
      ))}
    </Suspense>
  );
}
