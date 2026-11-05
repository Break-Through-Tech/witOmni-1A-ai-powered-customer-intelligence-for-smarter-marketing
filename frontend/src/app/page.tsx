import { ComingSoon, PageHeader } from "@/components/page-header";
import { getOverview } from "@/lib/data";

function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function OverviewPage() {
  const overview = await getOverview();
  const { start, end } = overview.data_range;

  return (
    <>
      <PageHeader
        title="Your customers at a glance"
        subtitle={`Based on purchases ${monthYear(start)} – ${monthYear(end)} · predictions for the next 90 days`}
      />
      <ComingSoon spec="004" />
    </>
  );
}
