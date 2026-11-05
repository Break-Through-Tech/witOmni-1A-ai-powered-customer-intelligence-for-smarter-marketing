# 005 — Segment Pages

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 §6.2](000-product-spec.md), [002](002-data-layer.md), [003](003-design-system.md) |
| **Route** | `/segments/[slug]` (`/segments` redirects to the first segment) |
| **Last updated** | 2026-11-03 |

---

## 1. Job of this page

Answer: **Who are these customers, how are they different, and what do I do with them?**

Journeys served: 000 §7 #1, #2, #3.

---

## 2. Page structure (top to bottom)

```
[Loyal regulars] [Occasional regulars ⭐] [New & undecided ⭐] [At-risk / lapsed]   ← tabs

● Occasional regulars  Focus                                  [Ask assistant]
Come back every so often. A nudge can turn them into regulars.
How customers get here: 50%+ chance of buying again, but not a Loyal regular.

[Customers 1,480 (34%)] [Revenue £1.68M (19%)] [Chance of buying again 63%] [Last bought 55 days ago]

Recommended action ──────────────────────────────────────────
 Send personalised reminders and a time-limited incentive.   [Generate strategy]

How they compare to all customers ──────────────────────────
 Orders │ Total spend │ Order value │ Days since last purchase   ← 4 small charts

What they're likely to buy ──────────────────────────────────
 Top 5 categories by expected spend (bars)        [See in Categories →]

Customers in this segment ───────────────────────────────────
 Table sorted by chance of buying again          [Export CSV]
```

---

## 3. Sections

### 3.1 Segment tabs
- All 4 segments in fixed order (003 §3), with color dot and "Focus" tag where it applies.
- The selected tab is the page's segment. Switching tabs changes the URL.

### 3.2 Header
- Segment badge, name, "Focus" tag (if focus).
- **Description** from `lib/segments.ts` (002 §5).
- **How customers get here:** the segment rule in plain language:

| Segment | Rule (plain language) |
|---|---|
| Loyal regulars | 70%+ chance of buying again **and** bought in the last 45 days |
| Occasional regulars | 50%+ chance of buying again, but not a Loyal regular |
| New & undecided | Under 50% chance, but bought in the last 180 days |
| At-risk / lapsed | Under 50% chance and no purchase in over 180 days |

### 3.3 KPI tiles (4)
Customers (count + % of all), Revenue (£ + % of all), Chance of buying again (average), Last bought (median days ago).

### 3.4 Recommended action
Segment card action text (002 §5) + **Generate strategy** (opens assistant: "Give me a strategy for my {segment} customers").

### 3.5 How they compare to all customers
- **Four small bar charts**, one per measure. Different scales, so never one combined chart (003 §4).
- Each chart has 2 bars: this segment (segment color) vs. all customers (gray), with direct value labels.
- Measures (medians): orders, total spend, average order value, days since last purchase.
- One-line takeaway above the charts, e.g. "Occasional regulars order 1.5× as often as the average customer."
  - **Not hard-coded, not AI.** A template in code: compute segment ÷ all-customer ratio for each of the 4 measures, pick the one furthest from 1× (compared so that 0.25× counts the same as 4×), fill the sentence.
  - Templates: "{Segment} {verb phrase} {ratio}× {more/less} than the average customer" (e.g. "order", "spend", "spend per order"); for recency: "{Segment} last bought {n} days ago, vs. {m} for the average customer."
  - Ratios rounded to 1 decimal; skip the line if no measure differs by at least 1.2×.
  - Updates automatically when the data changes. Uses no AI quota.

Current medians:

| | Orders | Total spend | Order value | Days since last purchase |
|---|---|---|---|---|
| **All customers** | 2 | £669 | £292 | 51 |
| Loyal regulars | 7 | £2,322 | £342 | 13 |
| Occasional regulars | 3 | £744 | £303 | 55 |
| New & undecided | 1 | £259 | £221 | 72 |
| At-risk / lapsed | 1 | £272 | £226 | 267 |

### 3.6 What they're likely to buy
- Top 5 categories for this segment by total expected spend (single hue bars).
- Hover: expected spend, number of likely buyers in the segment.
- Click a bar → that category page, **filtered to this segment**.
- Customers without category scores are excluded, with a note: "{n} customers in this segment don't have enough history for category predictions."
- **"Leans toward" note:** below the chart, only if the segment leans toward a category by **≥ 10%**, e.g. "Leans toward Christmas (+14% vs. average)." Max 2 categories. No note if nothing reaches 10%.
  - **Lean** = the category's share of this segment's total buy probability ÷ its share across all customers. Measured against the segment's own level, since Loyal regulars score higher on everything.
  - Only categories with ≥ 20 likely buyers (≥ 30%) in the segment count, to avoid noise.
  - **Why not a full "distinctive" chart:** tested 2026-11-03. Segments differ in *how much* they buy, not *what*: the biggest lean is +14%, most are +1–5%. Current leans (from `build_data.py`): Loyal regulars → Clocks (+11%); New & undecided → Christmas (+14%); Occasional regulars and At-risk / lapsed → none (At-risk's biggest is Christmas at +9.6%, just under the cutoff).

### 3.7 Customers in this segment
- The Customers table (spec 006) pre-filtered to this segment, sorted by chance of buying again (highest first).
- Columns: Customer ID, chance of buying again, orders, total spend, last bought, top category.
- Click a row → customer profile.
- **Export CSV** of the full segment list (000 FR-5).

---

## 4. Data

| Section | Source (002) |
|---|---|
| Tabs, header, action | `lib/segments.ts` |
| KPI tiles, comparison charts | `segments.json` (segment + all-customer medians) |
| Likely to buy | `segments.json` → add `top_categories` per segment (see §7) |
| Customer table | `customers.json` filtered by segment |

---

## 5. States

| State | Behavior |
|---|---|
| Unknown slug | 404 page with links to the 4 segments |
| Loading | Skeletons, no layout shift |
| Assistant unavailable | Generate strategy still visible; assistant shows the error |

---

## 6. Acceptance criteria

- [ ] Tabs show all 4 segments in fixed order; URL updates on switch.
- [ ] Header shows the right description and plain-language rule for each segment.
- [ ] KPI values and comparison medians match `segments.json`.
- [ ] Comparison is 4 separate charts, segment color vs. gray, labeled.
- [ ] Category bars link to the category page filtered to this segment.
- [ ] Customer table is pre-filtered and sorted by chance of buying again; CSV export contains every customer in the segment.
- [ ] Light/dark mode, keyboard navigation, "View as table" on every chart.

---

## 7. Changes to other specs

- **002 §3.2:** add `top_categories` (top 5 by expected spend, with likely buyer counts), `leans` (categories with lean ≥ 1.10, max 2), and `no_category_scores` count to each segment in `segments.json`.

---

## 8. Open questions

1. ~~"Likely to buy" looks similar across segments~~ **Decided:** keep top 5 by expected spend, plus a "Leans toward" note where a lean is ≥ 10% (§3.6).
