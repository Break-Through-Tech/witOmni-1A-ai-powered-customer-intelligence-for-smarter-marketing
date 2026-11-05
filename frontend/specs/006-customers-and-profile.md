# 006 — Customers & Customer Profile

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 §6.3](000-product-spec.md), [002](002-data-layer.md), [003](003-design-system.md) |
| **Routes** | `/customers` (table), `/customers/[id]` (profile) |
| **Last updated** | 2026-11-05 |

---

## 1. Job of these pages

- **Customers table:** "Which customers match what I'm looking for?"
- **Customer profile:** "Tell me about this customer and what to offer them."

Journeys served: 000 §7 #5 (and the table inside segment pages, 005 §3.7).

---

## 2. Customers table

### 2.1 Design rule: start small

Non-technical users should never land on a wall of 4,338 rows. The page opens with a **short, sorted list** and the user narrows down from there.

- **Default view:** top 25 customers by "Sort by" (default: most likely to buy again). **Show 25 more** button below; no page numbers.
- **5 columns only.** Everything else is on the profile.
- **3 simple filters visible**; the rest behind **More filters**.
- **Summary line** in plain words, updated live: "Showing the top 25 of 1,480 customers who bought in the last 90 days."

### 2.2 Layout

```
Customers                                                   [Ask assistant]

[🔍 Find a customer by ID…]

Sort by: [Most likely to buy again ▾]
Show:    [Any segment ▾] [Any time ▾] [Any spend ▾]   More filters ▸   Clear

Showing the top 25 of 4,338 customers                     [Export list]

Customer   Segment               Chance   Spend     Last bought
18225      ● Loyal regulars      91%      £5,505    3 days ago     ›
18223      ● Loyal regulars      91%      £6,485    5 days ago     ›
…
                          [Show 25 more]
```

- **Sort by** options (plain words): Most likely to buy again · Biggest spenders · Most recent · Longest since last purchase · Most orders.
- Each row is clickable (›) → profile.

### 2.3 Columns

| Column | Format |
|---|---|
| Customer | ID |
| Segment | Segment badge (003 §5) |
| Chance of buying again | Probability display |
| Total spend | £ |
| Last bought | "N days ago" |

Column headers are also clickable to sort. Orders, average order value, country, and top category are **not** columns; they're on the profile and available as filters.

### 2.4 Search and filters

| Filter | Where | Control |
|---|---|---|
| Search | Top | Customer ID, starts-with. Exact match + Enter → profile |
| Segment | Visible | Dropdown, 4 segments in fixed order |
| Last bought | Visible | Any time · last 30 days · 1–3 months · 3–6 months · 6+ months |
| Spend | Visible | Any · top 10% · top half · bottom half (**percentiles**, so it works for any business) |
| Chance of buying again | More filters | High (70%+) · Medium (50–70%) · Low (under 50%) |
| Country | More filters | Dropdown, sorted by customer count |
| Likely next category | More filters | Dropdown, 27 categories + "Not enough history" |

- Filters combine with AND. **Clear** resets all.
- Active filters show as removable chips under the filter row.
- **Persistence (000 FR-4):** filters and sort live in the URL (`?segment=…&min=50`). Back button and shared links keep them. Links from other pages (e.g. Overview "Likely to buy again" tile → `?min=50`) use the same params.

### 2.5 Export
**Export list** downloads every customer matching the current filters (not just the 25 shown), with all fields from `customers.json` (orders, AOV, country, top category included), probability as %, money as numbers. File name: `customers-YYYY-MM-DD.csv` (000 FR-5).

### 2.6 Data and performance
- Reads `customers.json` (002 §3.3), ~4,338 rows. Small enough to send to the browser once; filtering, sorting, and paging happen client-side (TanStack Table).
- Same component is reused on segment pages with the segment filter locked (005 §3.7).

---

## 3. Customer profile

### 3.1 Layout

```
← Back to customers

Customer 12347   ● Loyal regulars   Iceland              [Generate strategy]
91% chance of buying again in the next 90 days

[Orders 7] [Total spend £4,310] [Average order £616] [Last bought 2 days ago]

What they're likely to buy next ──────────────────────────
 Kitchenware & Dining   71%  £46   Already buys
 Boxes, Tins & Storage  69%  £36   Already buys
 …                                   (5 bars)

Purchase history ─────────────────────────────────────────
 Monthly spend, Dec 2010 – Dec 2011 (columns)

More details ▸
```

### 3.2 Sections

**Header**
- Customer ID, Segment badge (links to segment page), country.
- Big line: "{n}% chance of buying again in the next 90 days" with ⓘ tooltip (003 §6).
- **Generate strategy** → assistant with "Give me a strategy for customer {id}" (assistant calls `get_customer`).

**KPI tiles (4):** Orders, Total spend, Average order value, Last bought.

**What they're likely to buy next**
- Top 5 categories by expected spend, horizontal bars (single hue), sorted.
- Each row: category name, buy probability (%), expected spend (£), and a tag: **"Already buys"** (blue) or **"New"** (gray) with text, never color alone (003 §3).
- Click a row → that category page.
- No category scores → empty state: "Not enough history for category predictions" (000 FR-6).

**Purchase history**
- Column chart of monthly spend over the full data range (13 months). Months with no orders show as 0, not gaps.
- Hover: month, spend, number of orders.

**More details** (collapsed by default)

| Label | From | Example (12347) |
|---|---|---|
| Customer since | `customer_age_days` → date | Dec 2010 |
| Items bought | `total_items` | 2,458 |
| Different products | `unique_products` | 103 |
| Average days between orders | `mean_order_gap_days` | 60 |
| Products bought more than once | `repeat_purchase_rate` (share of their different products bought 2+ times) | 42% |

- `product_diversity_ratio` (different products ÷ items) is **not shown**: it's a model input that means little to a business owner (e.g. 0.04).

### 3.3 Data
- Server-rendered from `customer_details.json` via `getCustomer(id)` (002 §3.4). Only that one customer is sent to the browser.
- The assistant's `get_customer` tool reads the same loader, so the profile and the assistant always agree.

---

## 4. States

| State | Behavior |
|---|---|
| Unknown customer ID | "No customer with ID {id}." + search box + link back to the table |
| No category scores | Empty state in "Likely to buy next" (FR-6); rest of the page works |
| Filters match nothing | "No customers match these filters." + Clear button |
| Loading | Skeleton rows / tiles, no layout shift |
| Assistant unavailable | Generate strategy still shows; assistant shows the error (FR-7) |

---

## 5. Acceptance criteria

- [ ] Page opens with the top 25 by chance of buying again, 5 columns, and a plain-words summary line.
- [ ] "Show 25 more" adds rows; no page numbers.
- [ ] Every filter works alone and combined; summary line count is correct.
- [ ] Filters survive back/forward and page reload (URL params).
- [ ] CSV export contains every filtered row, not just the current page.
- [ ] Typing an exact ID and pressing Enter opens the profile.
- [ ] Profile values match `customer_details.json` for 3 spot-checked IDs (incl. one without category scores).
- [ ] "Already buys" / "New" tags shown with text, not color alone.
- [ ] Unknown ID shows the not-found state, not a crash.
- [ ] Light/dark mode, keyboard navigation, "View as table" on both profile charts.

---

## 6. Open questions

1. ~~Ratio features~~ **Checked** in `witOmni_1A.ipynb`: repeat rate shown as "Products bought more than once"; diversity ratio hidden (§3.2).
