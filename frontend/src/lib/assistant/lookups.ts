// Read-only lookups behind the assistant's tools (spec 008 §4).
// Plain functions over lib/data.ts, so the assistant and the pages always agree.
// Kept free of AI SDK code so they can be wrapped as an MCP server later.
import "server-only";

import {
  getCategories,
  getCategory,
  getCustomer,
  getOverview,
  getSegments,
} from "../data";
import { getSegment, SEGMENTS } from "../segments";
import type { Source } from "./sources";

const MAX_LIST = 20;

const r2 = (n: number) => Math.round(n * 100) / 100;
const p = (n: number) => `${Math.round(n * 100)}%`;

function norm(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export async function findCategory(nameOrSlug: string) {
  const categories = await getCategories();
  const key = norm(nameOrSlug);
  return (
    categories.find((c) => norm(c.slug) === key || norm(c.name) === key) ??
    categories.find((c) => norm(c.name).includes(key) || key.includes(norm(c.name)))
  );
}

async function categoryNames() {
  return (await getCategories()).map((c) => c.name);
}

export async function overviewLookup() {
  const o = await getOverview();
  const categories = await getCategories();
  return {
    source: { id: "overview", label: "Business overview", href: "/" } satisfies Source,
    data_range: o.data_range,
    predictions_cover: "the next 90 days",
    total_customers: o.total_customers,
    likely_to_buy_again: p(o.likely_to_repeat_pct),
    revenue_at_risk_gbp: r2(o.revenue_at_risk),
    estimated_category_spend_gbp: r2(o.expected_category_spend),
    segments: o.segments.map((s) => ({
      segment: getSegment(s.slug)?.name ?? s.slug,
      customers: s.customers,
      share_of_customers: p(s.customer_share),
      revenue_gbp: r2(s.revenue),
      share_of_revenue: p(s.revenue_share),
    })),
    top_categories_by_expected_spend: [...categories]
      .sort((a, b) => b.expected_spend - a.expected_spend)
      .slice(0, 5)
      .map((c) => ({ category: c.name, expected_spend_gbp: r2(c.expected_spend), likely_buyers: c.likely_buyers })),
    all_category_names: categories.map((c) => c.name),
  };
}

export async function segmentLookup(segment: string) {
  const seg = getSegment(segment.replace(/ customers?$/i, ""));
  if (!seg) return { error: "Unknown segment", valid_segments: SEGMENTS.map((s) => s.name) };
  const stats = (await getSegments()).find((s) => s.slug === seg.slug);
  if (!stats) return { error: "No data for this segment" };
  return {
    source: { id: `segment:${seg.slug}`, label: `${seg.name} segment`, href: `/segments/${seg.slug}` } satisfies Source,
    segment: seg.name,
    focus_segment: seg.focus,
    description: seg.description,
    rule: seg.rule,
    recommended_action: seg.action,
    customers: stats.customers,
    share_of_customers: p(stats.customer_share),
    revenue_gbp: r2(stats.revenue),
    share_of_revenue: p(stats.revenue_share),
    average_chance_of_buying_again: p(stats.avg_probability),
    typical_customer: {
      orders: stats.medians.invoice_count,
      total_spend_gbp: stats.medians.total_spend,
      average_order_gbp: stats.medians.avg_order_value,
      days_since_last_purchase: stats.medians.recency_days,
    },
    typical_customer_all_customers: {
      orders: stats.all_customers_medians.invoice_count,
      total_spend_gbp: stats.all_customers_medians.total_spend,
      average_order_gbp: stats.all_customers_medians.avg_order_value,
      days_since_last_purchase: stats.all_customers_medians.recency_days,
    },
    top_categories: stats.top_categories.map((c) => ({
      category: c.category,
      expected_spend_gbp: c.expected_spend,
      likely_buyers: c.likely_buyers,
    })),
    leans_toward: stats.leans.map((l) => `${l.category} (+${Math.round((l.lean - 1) * 100)}% vs. average)`),
  };
}

export async function customerLookup(customerId: number) {
  const c = await getCustomer(customerId);
  if (!c) return { error: `No customer with ID ${customerId}` };
  const seg = getSegment(c.segment);
  const recent = c.monthly_spend.filter((m) => m.orders > 0).slice(-3);
  return {
    source: { id: `customer:${c.id}`, label: `Customer ${c.id}`, href: `/customers/${c.id}` } satisfies Source,
    customer_id: c.id,
    segment: seg?.name ?? c.segment,
    segment_recommended_action: seg?.action,
    chance_of_buying_again: p(c.probability),
    orders: c.invoice_count,
    total_spend_gbp: c.total_spend,
    average_order_gbp: c.avg_order_value,
    days_since_last_purchase: c.recency_days,
    country: c.country,
    likely_next_categories: c.top_categories
      ? c.top_categories.map((t) => ({
          category: t.category,
          chance_to_buy: p(t.buy_probability),
          expected_spend_gbp: t.expected_spend,
          already_buys: t.already_buys,
        }))
      : "Not enough history for category predictions",
    recent_months_with_orders: recent.map((m) => ({ month: m.month, spend_gbp: m.spend, orders: m.orders })),
  };
}

export async function categoryLookup(args: {
  category: string;
  segment?: string;
  new_buyers_only?: boolean;
  limit?: number;
}) {
  const cat = await findCategory(args.category);
  if (!cat) return { error: "Unknown category", valid_categories: await categoryNames() };
  const detail = await getCategory(cat.slug);
  if (!detail) return { error: "No data for this category" };
  const seg = args.segment ? getSegment(args.segment) : undefined;
  if (args.segment && !seg) return { error: "Unknown segment", valid_segments: SEGMENTS.map((s) => s.name) };

  const limit = Math.min(Math.max(args.limit ?? 10, 1), MAX_LIST);
  const pick = (list: typeof detail.likely_new_buyers) => {
    const rows = seg ? list.filter((r) => r.segment === seg.slug) : list;
    return {
      count: seg ? rows.length : list === detail.likely_new_buyers ? detail.likely_new_total : detail.existing_total,
      top: rows.slice(0, limit).map((r) => ({
        customer_id: r.id,
        segment: getSegment(r.segment)?.name ?? r.segment,
        chance_to_buy: p(r.buy_probability),
        expected_spend_gbp: r.expected_spend,
        days_since_last_purchase: r.recency_days,
      })),
    };
  };
  const newBuyers = pick(detail.likely_new_buyers);
  return {
    source: {
      id: `category:${cat.slug}`,
      label: `${cat.name} category${seg ? ` (${seg.name})` : ""}`,
      href: `/categories/${cat.slug}`,
    } satisfies Source,
    category: cat.name,
    segment_filter: seg?.name ?? "all segments",
    category_totals_all_segments: {
      current_buyers: cat.buyers,
      past_revenue_gbp: cat.revenue,
      likely_buyers_50pct_plus: cat.likely_buyers,
      estimated_spend_next_90_days_gbp: cat.expected_spend,
    },
    ...(seg ? { lists_below_cover: `${seg.name} only, within the top 500 per list` } : {}),
    likely_new_buyers: {
      ...newBuyers,
      note:
        !seg && detail.likely_new_total < 20
          ? "Very few likely new buyers: a broad campaign may work better than a targeted list."
          : "Never bought this category, 30%+ chance to buy it.",
    },
    ...(args.new_buyers_only ? {} : { existing_buyers: pick(detail.existing_buyers) }),
    ranked_by: "expected spend",
  };
}

export async function lowCategoriesLookup(by: "buyers" | "revenue" = "buyers", limit = 5) {
  const rank = by === "buyers" ? "rank_by_buyers" : "rank_by_revenue";
  const n = Math.min(Math.max(limit, 1), 10);
  return {
    source: {
      id: `weakest-categories:${by}`,
      label: `Weakest categories by ${by}`,
      href: "/categories",
    } satisfies Source,
    ranked_by: by === "buyers" ? "fewest buyers" : "least revenue",
    weakest_categories: [...(await getCategories())]
      .sort((a, b) => a[rank] - b[rank])
      .slice(0, n)
      .map((c) => ({
        category: c.name,
        buyers: c.buyers,
        past_revenue_gbp: c.revenue,
        likely_buyers_50pct_plus: c.likely_buyers,
        likely_new_buyers: c.likely_new_buyers,
      })),
  };
}

/** Audience row for a strategy card: filled from data, never from model text (008 §6). */
export async function resolveAudience(
  type: "segment" | "category" | "customer",
  key: string,
  newBuyers = true,
) {
  if (type === "segment") {
    const seg = getSegment(key.replace(/ customers?$/i, ""));
    const stats = seg && (await getSegments()).find((s) => s.slug === seg.slug);
    if (seg && stats)
      return { type, label: seg.name, count: stats.customers, href: `/segments/${seg.slug}`, segment: seg.slug };
  }
  if (type === "category") {
    const cat = await findCategory(key);
    if (cat)
      return newBuyers
        ? { type, label: `${cat.name} · likely new buyers`, count: cat.likely_new_buyers, href: `/categories/${cat.slug}` }
        : { type, label: `${cat.name} · existing buyers`, count: cat.buyers, href: `/categories/${cat.slug}?tab=existing` };
  }
  if (type === "customer") {
    const id = Number(String(key).replace(/\D/g, ""));
    const c = Number.isInteger(id) ? await getCustomer(id) : null;
    if (c) return { type, label: `Customer ${c.id}`, count: 1, href: `/customers/${c.id}`, segment: c.segment };
  }
  return null;
}
