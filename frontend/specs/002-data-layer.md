# 002 — Data Layer

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 — Product Spec](000-product-spec.md), [001 — Architecture](001-architecture.md) |
| **Last updated** | 2026-11-03 |

---

## 1. Purpose

Turn the model output CSVs and the raw transactions into small, typed JSON files the dashboard and the AI assistant can read fast. One script, run by hand, same output every time.

---

## 2. The build script

- **File:** `frontend/scripts/build_data.py`
- **Run from repo root:** `python frontend/scripts/build_data.py`
- **Needs:** `pandas`, `openpyxl` (added to `requirements.txt`)
- **Writes to:** `frontend/data/` (overwrites everything except `model_metrics.json`, which is hand-written)
- **When to re-run:** normally once. Re-run only when a model output CSV changes: the planned switch to Random Forest scores (001 §8), or if a teammate re-runs a model notebook and its results change.
- **Deterministic:** same inputs give byte-identical outputs (sorted keys, fixed rounding), so git diffs show real changes only.

### Inputs

| Input | Used for |
|---|---|
| `data/model_outputs/repeat_purchase_scores.csv` | Probabilities, segments, behavior metrics |
| `data/category_data/customer_per_category_scores.csv` | Category buy probability and expected spend |
| `data/category_data/stockcode_to_category.csv` | Mapping transactions to categories |
| `data/Online Retail.xlsx` | Country, monthly history, existing category buyers, category revenue |

### Cleaning rules for raw transactions

Same as notebook 5, so numbers match the model:

1. Drop exact duplicate rows
2. Drop rows with no `CustomerID`
3. Drop cancellations (`InvoiceNo` starts with `C`)
4. Keep only `Quantity > 0` and `UnitPrice > 0`
5. `TotalPrice = Quantity × UnitPrice`

---

## 3. Output files

All money in GBP, rounded to 2 decimals. Probabilities as 0–1, rounded to 4 decimals (the UI formats them as %).

### 3.1 `overview.json`
```json
{
  "data_range": { "start": "2010-12-01", "end": "2011-12-09" },
  "scored_as_of": "2011-12-10",
  "total_customers": 4338,
  "likely_to_repeat_pct": 0.62,
  "revenue_at_risk": 447753.48,
  "expected_category_spend": 0,
  "segments": [{ "slug": "loyal-regulars", "customers": 1199, "revenue": 6297528.78, "revenue_share": 0.71 }],
  "top_actions": [{ "segment": "occasional-regulars", "action": "...", "customers": 1480 }]
}
```
- `likely_to_repeat_pct`: share of customers with probability ≥ 0.5
- `revenue_at_risk`: total historical spend of At-risk / lapsed customers
- `expected_category_spend`: sum of Expected spend (£) across all customer × category rows
- `top_actions`: the two focus segments first (Occasional regulars, New & undecided), then the rest by revenue

### 3.2 `segments.json`
One object per segment: `slug`, `customers`, `revenue`, `revenue_share`, `avg_probability`, medians (`recency_days`, `invoice_count`, `total_spend`, `avg_order_value`), and the same medians for **all customers** for comparison. Names, colors, rules text, and recommended actions are **not** stored here; they live in `lib/segments.ts` (§5).

### 3.3 `customers.json` (list view, sent to browser)
One row per customer (4,338):
```json
{
  "id": 12347, "segment": "loyal-regulars", "probability": 0.9062,
  "recency_days": 2, "invoice_count": 7, "total_spend": 4310.0,
  "avg_order_value": 615.71, "country": "Iceland", "top_category": "Kitchenware & Dining"
}
```
- `country`: the customer's most common country in transactions
- `top_category`: highest Expected spend category, or `null` if no category scores (000 FR-6)

### 3.4 `customer_details.json` (server only)
Keyed by customer ID. Everything in 3.3, plus:
- All 10 behavior features from the scores file
- `top_categories`: top 5 by Expected spend, each `{ category, buy_probability, expected_spend, already_buys }`, or `null`
- `monthly_spend`: `[{ "month": "2010-12", "spend": 711.79 }, ...]` for the purchase history chart

Read by the customer profile page and the `get_customer` tool. Never sent to the browser whole.

### 3.5 `categories.json`
One object per category (27):
```json
{
  "slug": "christmas", "name": "Christmas",
  "buyers": 1500, "revenue": 120000.0,
  "likely_buyers": 900, "expected_spend": 45000.0,
  "rank_by_buyers": 12, "rank_by_revenue": 15
}
```
- `buyers` / `revenue`: from cleaned transactions, full history
- `likely_buyers`: customers with buy probability ≥ 0.5
- `rank_by_buyers` / `rank_by_revenue`: 1 = weakest. The page has a **toggle** (fewest buyers / least revenue) and flags the bottom 5 for whichever is selected (000 §6.4)
- The `DROP` category in `stockcode_to_category.csv` is leftover junk (72 buyers, not scored by the model) and is **excluded**

### 3.6 `category/<slug>.json` (server only)
Two ranked lists, highest **Expected spend (£)** first (000 §6.4):
```json
{
  "existing_buyers": [{ "id": 12347, "segment": "...", "buy_probability": 0.71, "expected_spend": 120.5 }],
  "likely_new_buyers": [ ... ]
}
```
- **Existing buyers:** bought from this category at least once
- **Likely new buyers:** never bought from it **and** buy probability ≥ 30%
- Each list capped at the top 500 to keep files small
- If a category has fewer than 20 likely new buyers, the page says so instead of showing a near-empty list

**Why 30% (backtest, 2026-11-03):** the category model scores every customer on all 27 categories, including ones they never bought (zero history in that category, plus their history elsewhere). Checked against what customers actually bought in the quarter after the model's cutoff:

| Never-bought, buy probability | Customers | Actually bought |
|---|---|---|
| any (baseline) | 3,349 | 12% |
| ≥ 20% | 2,603 | 30% |
| **≥ 30%** | **1,644** | **40%** |
| ≥ 50% | 725 | 57% |

- Ranking quality within never-bought categories: AUC 0.75 (vs 0.77 for categories already bought)
- 23 of 27 categories have 50+ candidates at 30%. Thin: Umbrellas (9), Jewellery (35), Clocks (36), Floral (45)
- Christmas dominates (1,082 candidates), partly because the test quarter includes Christmas
- Slightly optimistic: the exported scores include customers the model trained on

### 3.7 `model_metrics.json`
Hand-written (see 001). The script leaves it alone.

---

## 4. Checks the script runs

The script stops with a clear error if any of these fail:

- Every `marketing_segment` value is one of the 4 known notebook names, then translated to its slug: `High-probability active` → `loyal-regulars`, `Promising reactivation` → `occasional-regulars`, `Nurture` → `new-and-undecided`, `At-risk / lapsed` → `at-risk-lapsed` (display names in 000 §5)
- Every probability is between 0 and 1
- No duplicate customer IDs
- Every category name in the scores matches `stockcode_to_category.csv`
- Exactly 27 categories in the output (no `DROP`)

And prints a short report: customer count, customers without category scores (expected ~989), rows dropped by cleaning, output file sizes.

---

## 5. Shared code in the app

| File | Contents |
|---|---|
| `lib/segments.ts` | **Single source** for each segment: `slug`, display name, one-line description, color, rule text, recommended action, `focus: true/false` (000 NFR-7) |

**Segment descriptions** (shown on cards, segment pages, and tooltips):

| Segment | Description |
|---|---|
| Loyal regulars | Your best customers. They order often and bought recently. |
| Occasional regulars | Come back every so often. A nudge can turn them into regulars. |
| New & undecided | Bought once, recently. Could become regulars or drift away. |
| At-risk / lapsed | Bought once, long ago. Unlikely to return without a reason. |
| `lib/types.ts` | TypeScript types matching every JSON shape in §3 |
| `lib/data.ts` | Loaders: `getOverview()`, `getSegments()`, `getCustomers()`, `getCustomer(id)`, `getCategories()`, `getCategory(slug)`, `getModelMetrics()` |

- Loaders are **server-only**. Pages and assistant tools both call them, so they always see the same data.
- Files are read once and cached in memory per server instance.

### Which tool reads what

| Assistant tool (000 §6.5) | Loader |
|---|---|
| `get_overview()` | `getOverview()` |
| `get_segment_summary(segment)` | `getSegments()` + `lib/segments.ts` |
| `get_customer(customer_id)` | `getCustomer(id)` |
| `top_customers_for_category(...)` | `getCategory(slug)` |
| `low_purchase_categories(limit)` | `getCategories()` |

---

## 6. Known caveats

- **Category scores are older than repeat scores.** The category model used a cutoff of ~2011-09-07 and predicts the quarter that's already in the data. Repeat scores predict the 90 days after the data ends. Fine for ranking; mention on the Model insights page. **Fix planned** (§7).
- **~989 customers have no category scores** (no purchases before the category model's cutoff). They show "Not enough history" (000 FR-6).
- **No outlier removal.** Very large one-off orders (e.g. customer 12346, £77k in one order) stay in, matching the model inputs.

---

## 7. Open questions

1. ~~Likely new buyer threshold~~ **Decided:** buy probability ≥ 30% (§3.6).
2. ~~Low-purchase rule~~ **Decided:** both, with a toggle (fewest buyers / least revenue), bottom 5 flagged (§3.5).
3. **Category model re-run (planned):** re-score the category model as of the end of the data, the same way notebook 5 does for repeat scores (train on the cutoff, then score everyone as of the last date). This lines up both models on the next 90 days and gives category scores to the 989 customers who have none. Owner: notebook 4 author, or a standalone script on its own branch. Output must keep the same CSV format so no frontend changes are needed; then re-run `build_data.py`.
