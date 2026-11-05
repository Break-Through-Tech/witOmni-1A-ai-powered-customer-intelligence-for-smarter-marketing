import { notFound } from "next/navigation";
import { ComingSoon, PageHeader } from "@/components/page-header";
import { getSegment, SEGMENTS } from "@/lib/segments";

export function generateStaticParams() {
  return SEGMENTS.map((s) => ({ slug: s.slug }));
}

export default async function SegmentPage({
  params,
}: PageProps<"/segments/[slug]">) {
  const { slug } = await params;
  const segment = getSegment(slug);
  if (!segment || segment.slug !== slug) notFound();

  return (
    <>
      <PageHeader
        title={segment.name}
        subtitle={segment.description}
        askAbout={segment.name}
      />
      <ComingSoon spec="005" />
    </>
  );
}
