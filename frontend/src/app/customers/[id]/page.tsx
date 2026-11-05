import { Suspense } from "react";
import { ComingSoon, PageHeader } from "@/components/page-header";

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      {params.then(({ id }) => (
        <>
          <PageHeader title={`Customer ${id}`} askAbout={`customer ${id}`} />
          <ComingSoon spec="006" />
        </>
      ))}
    </Suspense>
  );
}
