import type { Segment } from "@/lib/segments";

/** Color dot + name, plus a "Focus" tag (003 §5). Never color alone. */
export function SegmentBadge({
  segment,
  showFocus = true,
}: {
  segment: Segment;
  showFocus?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: `var(--seg-${segment.slug})` }}
      />
      <span className="font-medium">{segment.name}</span>
      {showFocus && segment.focus && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-secondary">
          Focus
        </span>
      )}
    </span>
  );
}
