/**
 * Small paired bars: this segment vs. all customers (005 §3.5).
 * Plain HTML so two bars fit a small card; values are always shown as text,
 * so no separate table view is needed.
 */
export function CompareBars({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; valueLabel: string; color: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <figure className="rounded-[8px] border border-border bg-surface-1 p-4">
      <figcaption className="mb-3 text-sm font-medium">{title}</figcaption>
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="mb-1 flex justify-between gap-2 text-xs text-secondary">
              <span className="truncate">{r.label}</span>
              <span className="font-medium text-primary tabular-nums">{r.valueLabel}</span>
            </dt>
            <dd>
              <div className="h-3.5 w-full" title={`${r.label}: ${r.valueLabel}`}>
                <div
                  className="h-full rounded-r-[4px]"
                  style={{ width: `${Math.max((r.value / max) * 100, 1)}%`, background: r.color }}
                />
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
