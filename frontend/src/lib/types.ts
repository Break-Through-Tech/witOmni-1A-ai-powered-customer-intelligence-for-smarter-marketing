// Types for the JSON files written by scripts/build_data.py (spec 002 §3).
import type { SegmentSlug } from "./segments";

export interface SegmentMedians {
  recency_days: number;
  invoice_count: number;
  total_spend: number;
  avg_order_value: number;
}

export interface Overview {
  data_range: { start: string; end: string };
  scored_as_of: string;
  total_customers: number;
  likely_to_repeat_pct: number;
  revenue_at_risk: number;
  expected_category_spend: number;
  category_scores_current: boolean;
  segments: {
    slug: SegmentSlug;
    customers: number;
    customer_share: number;
    revenue: number;
    revenue_share: number;
  }[];
  top_actions: { segment: SegmentSlug; customers: number }[];
}

export interface SegmentStats {
  slug: SegmentSlug;
  customers: number;
  customer_share: number;
  revenue: number;
  revenue_share: number;
  avg_probability: number;
  medians: SegmentMedians;
  all_customers_medians: SegmentMedians;
  top_categories: {
    category: string;
    slug: string;
    expected_spend: number;
    likely_buyers: number;
  }[];
  leans: { category: string; slug: string; lean: number }[];
  no_category_scores: number;
}

export interface CustomerRow {
  id: number;
  segment: SegmentSlug;
  probability: number;
  recency_days: number;
  invoice_count: number;
  total_spend: number;
  avg_order_value: number;
  country: string | null;
  top_category: string | null;
}

export interface CustomerCategory {
  category: string;
  slug: string;
  buy_probability: number;
  expected_spend: number;
  already_buys: boolean;
}

export interface CustomerDetail extends CustomerRow {
  features: {
    recency_days: number | null;
    customer_age_days: number | null;
    invoice_count: number | null;
    total_spend: number | null;
    total_items: number | null;
    unique_products: number | null;
    avg_order_value: number | null;
    mean_order_gap_days: number | null;
    product_diversity_ratio: number | null;
    repeat_purchase_rate: number | null;
  };
  /** null = not enough history for category predictions (000 FR-6). */
  top_categories: CustomerCategory[] | null;
  monthly_spend: { month: string; spend: number; orders: number }[];
}

export interface CategorySummary {
  slug: string;
  name: string;
  buyers: number;
  revenue: number;
  likely_buyers: number;
  likely_new_buyers: number;
  expected_spend: number;
  /** 1 = weakest. */
  rank_by_buyers: number;
  rank_by_revenue: number;
}

export interface CategoryListRow {
  id: number;
  segment: SegmentSlug;
  buy_probability: number;
  expected_spend: number;
  recency_days: number;
}

export interface CategoryDetail {
  slug: string;
  name: string;
  existing_total: number;
  likely_new_total: number;
  existing_buyers: CategoryListRow[];
  likely_new_buyers: CategoryListRow[];
}

export interface ModelResult {
  model: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc: number;
}

export interface ModelMetrics {
  repeat_purchase: {
    target: string;
    scoring_model: string;
    final_model: string;
    test_set_size: number;
    test_results: ModelResult[];
    baselines: ModelResult[];
    cross_validated_roc_auc: { model: string; mean: number; std: number }[];
    feature_importance: {
      items: { feature: string; label: string; auc_drop: number }[];
    };
    direction: { items: { feature: string; coefficient: number }[] };
    threshold_tradeoff: {
      items: {
        threshold: number;
        share_targeted: number;
        precision: number;
        recall: number;
      }[];
    };
  };
  category_propensity: {
    target: string;
    scoring_model: string;
    results: { model: string; mean_auc: number; recall_at_5: number }[];
  };
  limitations: string[];
}
