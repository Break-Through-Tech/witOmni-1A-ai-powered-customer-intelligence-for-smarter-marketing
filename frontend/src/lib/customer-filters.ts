// Filters and sorting for the Customers page (spec 006 §2.4).
// Pure functions: the URL holds the state, these turn it into rows + words.
import { getSegment } from "./segments";
import type { CustomerRow } from "./types";

export const SORTS = {
  likely: "Most likely to buy again",
  spend: "Biggest spenders",
  recent: "Most recent",
  lapsed: "Longest since last purchase",
  orders: "Most orders",
} as const;
export type SortKey = keyof typeof SORTS;

export const LAST_BOUGHT = {
  "30": "in the last 30 days",
  "90": "1–3 months ago",
  "180": "3–6 months ago",
  older: "more than 6 months ago",
} as const;

export const SPEND = {
  top10: "in the top 10% by spend",
  tophalf: "in the top half by spend",
  bottomhalf: "in the bottom half by spend",
} as const;

export const CHANCE = {
  high: "High (70%+)",
  medium: "Medium (50–70%)",
  low: "Low (under 50%)",
} as const;

export const NO_CATEGORY = "none";

export interface Filters {
  q: string;
  sort: SortKey;
  segment: string;
  last: string;
  spend: string;
  chance: string[];
  country: string;
  category: string;
}

export function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort") ?? "";
  return {
    q: (params.get("q") ?? "").replace(/\D/g, ""),
    sort: (sort in SORTS ? sort : "likely") as SortKey,
    segment: params.get("segment") ?? "",
    last: params.get("last") ?? "",
    spend: params.get("spend") ?? "",
    chance: (params.get("chance") ?? "")
      .split(",")
      .filter((c): c is keyof typeof CHANCE => c in CHANCE),
    country: params.get("country") ?? "",
    category: params.get("category") ?? "",
  };
}

export function toSearch(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.sort !== "likely") p.set("sort", f.sort);
  if (f.segment) p.set("segment", f.segment);
  if (f.last) p.set("last", f.last);
  if (f.spend) p.set("spend", f.spend);
  if (f.chance.length) p.set("chance", f.chance.join(","));
  if (f.country) p.set("country", f.country);
  if (f.category) p.set("category", f.category);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Percentile cut-offs over all customers, so "top 10%" works for any business. */
export function spendCutoffs(all: CustomerRow[]) {
  const s = all.map((c) => c.total_spend).sort((a, b) => a - b);
  return { p90: quantile(s, 0.9), median: quantile(s, 0.5) };
}

function inLast(days: number, key: string): boolean {
  switch (key) {
    case "30":
      return days <= 30;
    case "90":
      return days > 30 && days <= 90;
    case "180":
      return days > 90 && days <= 180;
    case "older":
      return days > 180;
    default:
      return true;
  }
}

function chanceBand(p: number): keyof typeof CHANCE {
  return p >= 0.7 ? "high" : p >= 0.5 ? "medium" : "low";
}

const SORTERS: Record<SortKey, (a: CustomerRow, b: CustomerRow) => number> = {
  likely: (a, b) => b.probability - a.probability,
  spend: (a, b) => b.total_spend - a.total_spend,
  recent: (a, b) => a.recency_days - b.recency_days,
  lapsed: (a, b) => b.recency_days - a.recency_days,
  orders: (a, b) => b.invoice_count - a.invoice_count,
};

export function applyFilters(
  all: CustomerRow[],
  f: Filters,
  cut: { p90: number; median: number },
): CustomerRow[] {
  const rows = all.filter((c) => {
    if (f.q && !String(c.id).startsWith(f.q)) return false;
    if (f.segment && c.segment !== f.segment) return false;
    if (f.last && !inLast(c.recency_days, f.last)) return false;
    if (f.spend === "top10" && c.total_spend < cut.p90) return false;
    if (f.spend === "tophalf" && c.total_spend < cut.median) return false;
    if (f.spend === "bottomhalf" && c.total_spend >= cut.median) return false;
    if (f.chance.length && !f.chance.includes(chanceBand(c.probability))) return false;
    if (f.country && c.country !== f.country) return false;
    if (f.category === NO_CATEGORY && c.top_category !== null) return false;
    if (f.category && f.category !== NO_CATEGORY && c.top_category !== f.category) return false;
    return true;
  });
  const by = SORTERS[f.sort];
  return rows.sort((a, b) => by(a, b) || a.id - b.id);
}

/** Plain-words description: "Occasional regulars customers who bought in the last 30 days". */
export function describe(f: Filters): string {
  const seg = f.segment ? getSegment(f.segment) : undefined;
  const parts: string[] = [seg ? `${seg.name} customers` : "customers"];
  if (f.q) parts.push(`with an ID starting ${f.q}`);
  if (f.last) parts.push(`who bought ${LAST_BOUGHT[f.last as keyof typeof LAST_BOUGHT] ?? ""}`);
  if (f.spend) parts.push(SPEND[f.spend as keyof typeof SPEND] ?? "");
  if (f.chance.length) {
    const words = f.chance.map((c) => c);
    parts.push(`with a ${words.join(" or ")} chance of buying again`);
  }
  if (f.country) parts.push(`in ${f.country}`);
  if (f.category === NO_CATEGORY) parts.push("without category predictions");
  else if (f.category) parts.push(`most likely to buy ${f.category} next`);
  return parts.filter(Boolean).join(" ");
}
