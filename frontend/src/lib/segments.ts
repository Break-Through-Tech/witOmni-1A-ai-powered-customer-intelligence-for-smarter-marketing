// Single source of truth for segments (spec 000 NFR-7, 002 §5, 003 §3).
// Order matters: it's part of what makes the colors colorblind-safe.

export type SegmentSlug =
  | "loyal-regulars"
  | "occasional-regulars"
  | "new-and-undecided"
  | "at-risk-lapsed";

export interface Segment {
  slug: SegmentSlug;
  name: string;
  /** Name used in the model output CSV (notebook 5). */
  notebookName: string;
  description: string;
  /** Plain-language rule shown on the segment page (005 §3.2). */
  rule: string;
  action: string;
  focus: boolean;
  color: { light: string; dark: string };
}

export const SEGMENTS: readonly Segment[] = [
  {
    slug: "loyal-regulars",
    name: "Loyal regulars",
    notebookName: "High-probability active",
    description: "Your best customers. They order often and bought recently.",
    rule: "70%+ chance of buying again and bought in the last 45 days",
    action:
      "Recommend complementary products or loyalty benefits; avoid unnecessary discounts.",
    focus: false,
    color: { light: "#2a78d6", dark: "#3987e5" },
  },
  {
    slug: "occasional-regulars",
    name: "Occasional regulars",
    notebookName: "Promising reactivation",
    description: "Come back every so often. A nudge can turn them into regulars.",
    rule: "50%+ chance of buying again, but not a Loyal regular",
    action: "Send personalised reminders and a time-limited incentive.",
    focus: true,
    color: { light: "#eb6834", dark: "#d95926" },
  },
  {
    slug: "new-and-undecided",
    name: "New & undecided",
    notebookName: "Nurture",
    description: "Bought once, recently. Could become regulars or drift away.",
    rule: "Under 50% chance, but bought in the last 180 days",
    action: "Use low-cost content and product discovery messages.",
    focus: true,
    color: { light: "#1baf7a", dark: "#199e70" },
  },
  {
    slug: "at-risk-lapsed",
    name: "At-risk / lapsed",
    notebookName: "At-risk / lapsed",
    description: "Bought once, long ago. Unlikely to return without a reason.",
    rule: "Under 50% chance and no purchase in over 180 days",
    action: "Test win-back messaging, cap spend, and measure incremental lift.",
    focus: false,
    color: { light: "#eda100", dark: "#c98500" },
  },
] as const;

export function getSegment(slugOrName: string): Segment | undefined {
  const key = slugOrName.trim().toLowerCase();
  return SEGMENTS.find(
    (s) =>
      s.slug === key ||
      s.name.toLowerCase() === key ||
      s.notebookName.toLowerCase() === key,
  );
}

/** CSS variables (--seg-<slug>) for light and dark mode, generated from SEGMENTS. */
export function segmentColorCss(): string {
  const vars = (mode: "light" | "dark") =>
    SEGMENTS.map((s) => `--seg-${s.slug}:${s.color[mode]};`).join("");
  return (
    `:root{${vars("light")}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars("dark")}}}` +
    `:root[data-theme="dark"]{${vars("dark")}}`
  );
}
