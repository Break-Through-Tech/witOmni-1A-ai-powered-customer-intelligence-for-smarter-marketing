import { ComingSoon, PageHeader } from "@/components/page-header";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Your customers at a glance"
        subtitle="Based on purchases Dec 2010 – Dec 2011 · predictions for the next 90 days"
      />
      <ComingSoon spec="004" />
    </>
  );
}
