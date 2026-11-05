import { Suspense } from "react";
import { CustomersExplorer } from "@/components/customers-explorer";
import { PageHeader } from "@/components/page-header";
import { getCategories, getCustomers } from "@/lib/data";

// Customers page (spec 006 §2).
export default async function CustomersPage() {
  const [customers, categories] = await Promise.all([getCustomers(), getCategories()]);
  const categoryNames = categories.map((c) => c.name).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <PageHeader title="Customers" />
      {/* Filters come from the URL, which is only known at request time. */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[8px] bg-surface-1" />}>
        <CustomersExplorer customers={customers} categories={categoryNames} />
      </Suspense>
    </>
  );
}
