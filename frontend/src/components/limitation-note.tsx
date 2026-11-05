/** Small muted callout (003 §5 Limitation note). */
export function LimitationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-xs text-secondary">
      {children}
    </p>
  );
}
