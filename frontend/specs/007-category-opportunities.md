# 007 — Category Opportunities

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 §6.4](000-product-spec.md), [002](002-data-layer.md), [003](003-design-system.md), [006](006-customers-and-profile.md) |
| **Routes** | `/categories` (all categories), `/categories/[slug]` (one category) |
| **Last updated** | 2026-11-05 |

---

## 1. Job of these pages

- **All categories:** "Which product categories have the most room to grow, and which are falling behind?"
- **One category:** "Who should I target for this category?" (e.g. "Who should get the Christmas campaign?")

Journeys served: 000 §7 #3 and #4.

---

## 2. All categories page

### 2.1 Layout

```
Categories                                                   [Ask assistant]
What your customers are likely to buy next (estimated, 90 days)

Biggest opportunities ───────────────────────────────────────
 Kitchenware & Dining     ████████████████  £76,931
 Party & Tableware        █████████████     £62,527
 Boxes, Tins & Storage    █████████████     £62,149
 …  top 10                                   [Show all 27]

Categories to grow ─────────────────────────────────────────
 [Fewest buyers | Least revenue]
 Umbrellas & Rainwear     702 buyers  · £87,024   · 26 likely buyers   ›
 Cushions & Soft Furn.    893 buyers  · £61,103   · 50 likely buyers   ›
 …  bottom 5, flagged "Needs a boost"
```

### 2.2 Biggest opportunities
- Horizontal bars, single hue (003 §4), sorted by **expected spend** (highest first).
- **Top 10 shown**, "Show all 27" expands (start small, same rule as 006 §2.1).
- Direct label: £ expected spend. Hover adds: likely buyers, current buyers, past revenue.
- Click a bar → that category page.
- Label "estimated" with ⓘ tooltip; while `category_scores_current` is false (002 §3.1) the tooltip adds "Based on an earlier prediction window." This is data-driven, so it disappears by itself after the re-run.

### 2.3 Categories to grow
- Toggle: **Fewest buyers** (default) / **Least revenue** (000 §6.4). Uses `rank_by_buyers` / `rank_by_revenue` (002 §3.5).
- Shows the **bottom 5** for the selected view, each tagged "Needs a boost".
- Each row: buyers, past revenue, likely buyers. Click → category page.
- **Why show likely buyers here:** the weakest categories also have the fewest predicted buyers (see §5), so the page tells the owner when a category needs a broad campaign rather than a targeted list.

Current bottom 5:

| Fewest buyers | Buyers | | Least revenue | Revenue |
|---|---|---|---|---|
| Umbrellas & Rainwear | 702 | | Jewellery & Accessories | £47,041 |
| Cushions & Soft Furnishings | 893 | | Floral & Botanical | £55,483 |
| Clocks | 906 | | Cushions & Soft Furnishings | £61,103 |
| Jewellery & Accessories | 947 | | Umbrellas & Rainwear | £87,024 |
| Floral & Botanical | 1,334 | | Cards & Gift Wrap | £111,921 |

---

## 3. One category page

### 3.1 Layout

```
← All categories

Christmas                                         [Generate campaign]

[Buyers 2,587] [Past revenue £451K] [Likely buyers 1,081] [Expected spend £40K]

[Likely new buyers (1,082) | Already buy it (…)]        Segment: [Any ▾]

Showing the top 25 of 1,082 customers who haven't bought Christmas yet
                                                         [Export list]
Customer   Segment               Chance to buy   Expected spend   Last bought
…
                          [Show 25 more]
```

### 3.2 Sections

**Header:** category name + **Generate campaign** → assistant with "Give me a campaign for {category}" (assistant uses `top_customers_for_category`).

**KPI tiles (4):** Buyers, Past revenue, Likely buyers (≥ 50%), Expected spend. Each with ⓘ tooltip.

**Target lists** (two tabs, 000 §6.4):

| Tab | Who | Use |
|---|---|---|
| **Likely new buyers** (default) | Never bought this category, buy probability ≥ 30% | Cross-sell |
| **Already buy it** | Bought it at least once | Sell more / repeat |

- Ranked by **expected spend**, highest first (000 §6.4).
- **Segment filter** (dropdown, fixed order). Arriving from a segment page pre-sets it (005 §3.6).
- Same list component as Customers (006 §2): top 25, "Show 25 more", 5 columns:

| Column | Format |
|---|---|
| Customer | ID, click → profile |
| Segment | Segment badge |
| Chance to buy this category | % |
| Expected spend | £ |
| Last bought | "N days ago" |

- Summary line in plain words: "Showing the top 25 of {n} customers who haven't bought {category} yet."
- **Export list:** every customer in the current tab + filter (up to the 500 stored, 002 §3.6).
- **Fewer than 20 likely new buyers:** replace the list with "Only {n} customers look likely to try {category}. A broad campaign may work better than a targeted list." Currently: Umbrellas & Rainwear (9).

### 3.3 No category-specific notes
No hard-coded notes on individual categories (e.g. a Christmas seasonality note). They'd go stale after the category re-run (002 §7). The general "estimated" tooltip (§2.2) covers it.

---

## 4. Data

| Section | Source (002) |
|---|---|
| Biggest opportunities, categories to grow | `categories.json` |
| Category header, KPI tiles | `categories.json` |
| Target lists | `category/<slug>.json` (server-only, sent one page at a time) |

---

## 5. Current data (as of 2026-11-05)

Checked with the fixed StockCode join (002 §2 rule 6).

| Category | Expected spend | Likely buyers (≥ 50%) | Likely new buyers (≥ 30%) | Buyers | Revenue |
|---|---|---|---|---|---|
| Kitchenware & Dining | £76,931 | 827 | 95 | 3,043 | £723K |
| Party & Tableware | £62,527 | 886 | 106 | 3,191 | £590K |
| Boxes, Tins & Storage | £62,149 | 841 | 126 | 2,997 | £682K |
| Bags, Purses & Travel | £61,350 | 795 | 115 | 2,653 | £894K |
| Baking | £59,545 | 660 | 125 | 2,849 | £610K |
| … | | | | | |
| Christmas | £40,188 | 1,081 | 1,082 | 2,587 | £451K |
| … | | | | | |
| Umbrellas & Rainwear | £9,056 | 26 | 9 | 702 | £87K |
| Floral & Botanical | £6,025 | 41 | 45 | 1,334 | £55K |
| Jewellery & Accessories | £5,847 | 39 | 35 | 947 | £47K |

Takeaway: big categories are already widely bought, so their opportunity is mostly **existing buyers buying more**. Christmas is the standout for **new buyers**.

---

## 6. States

| State | Behavior |
|---|---|
| Unknown slug | 404 with link to all categories |
| Segment filter matches nothing | "No {segment} customers in this list." + reset filter |
| Thin list (< 20) | Message from §3.2 instead of the list |
| Loading | Skeleton bars / rows |
| Assistant unavailable | Generate campaign still shows; assistant shows the error (FR-7) |

---

## 7. Acceptance criteria

- [ ] Exactly 27 categories, no `DROP`.
- [ ] Biggest opportunities shows top 10, sorted by expected spend; "Show all 27" expands.
- [ ] Toggle switches the bottom 5 between fewest buyers and least revenue, matching `categories.json`.
- [ ] Category page opens on Likely new buyers; both tabs ranked by expected spend.
- [ ] Segment filter works and is pre-set when arriving from a segment page.
- [ ] Umbrellas & Rainwear shows the thin-list message.
- [ ] Export contains every customer in the current tab + filter.
- [ ] Light/dark mode, keyboard navigation, "View as table" on the bar chart.

---

## 8. Open questions

None.
