import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  askAbout,
}: {
  title: string;
  subtitle?: string;
  /** Page context for the assistant placeholder (008 §2). */
  askAbout?: string;
}) {
  const href = askAbout
    ? `/assistant?about=${encodeURIComponent(askAbout)}`
    : "/assistant";
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>
      <Link
        href={href}
        className="rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Ask assistant
      </Link>
    </header>
  );
}

/** Temporary body for pages not built yet. */
export function ComingSoon({ spec }: { spec: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-surface-1 p-8 text-sm text-secondary">
      This page is not built yet. See spec {spec} in <code>frontend/specs/</code>.
    </div>
  );
}
