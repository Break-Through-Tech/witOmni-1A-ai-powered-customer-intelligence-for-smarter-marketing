// One-line takeaway for "How they compare to all customers" (005 §3.5).
// A template in code: not hard-coded, not AI.
import type { SegmentMedians } from "./types";

const MIN_RATIO = 1.2;

type Measure = keyof SegmentMedians;

const PHRASES: Record<Exclude<Measure, "recency_days">, string> = {
  invoice_count: "order",
  total_spend: "spend",
  avg_order_value: "spend per order",
};

export function comparisonTakeaway(
  segmentName: string,
  seg: SegmentMedians,
  all: SegmentMedians,
): string | null {
  let best: { measure: Measure; ratio: number; strength: number } | null = null;
  for (const measure of Object.keys(PHRASES).concat("recency_days") as Measure[]) {
    const a = all[measure];
    const s = seg[measure];
    if (!(a > 0) || !(s > 0)) continue;
    const ratio = s / a;
    // Log-symmetric: 0.25× counts the same as 4×.
    const strength = Math.abs(Math.log(ratio));
    if (!best || strength > best.strength) best = { measure, ratio, strength };
  }
  if (!best || best.strength < Math.log(MIN_RATIO)) return null;

  if (best.measure === "recency_days") {
    return `${segmentName} last bought ${Math.round(seg.recency_days)} days ago, vs. ${Math.round(
      all.recency_days,
    )} for the average customer.`;
  }
  const more = best.ratio >= 1;
  const r = (more ? best.ratio : 1 / best.ratio).toFixed(1).replace(/\.0$/, "");
  return `${segmentName} ${PHRASES[best.measure]} ${r}× ${more ? "more" : "less"} than the average customer.`;
}
