# 004 — Overview Page

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 §6.1](000-product-spec.md), [002](002-data-layer.md), [003](003-design-system.md) |
| **Route** | `/` |
| **Last updated** | 2026-11-03 |

---

## 1. Job of this page

Answer in under 2 minutes (000 §4): **How healthy is my customer base, and what should I do first?**

Journeys served: 000 §7 #1 and #2.

---

## 2. Page structure (top to bottom)

```
Your customers at a glance                      [Ask assistant]
Based on purchases Dec 2010 – Dec 2011 · predictions for the next 90 days

[Customers] [Likely to buy again] [Revenue at risk] [Category opportunity]

Where to focus ─────────────────────────────────────────────
 ● Occasional regulars  Focus         ● New & undecided  Focus
 Come back every so often. A nudge    Bought once, recently. Could become
 can turn them into regulars.         regulars or drift away.
 1,480 customers (34%) · 19% rev      874 customers (20%) · 5% rev
 63% chance · 3 orders · 55 days ago  43% chance · 1 order · 72 days ago
 Action …  [Generate strategy]        Action …  [Generate strategy]

Segments ────────────────────────────────────────────────────
 Customers per segment (bars)        Revenue per segment (bars)

Top category opportunities ─────────────────────────────────
 Top 5 categories by expected spend (bars)      [See all →]
```

---

## 3. Sections

### 3.1 Header
- Title: **Your customers at a glance**
- Subtitle from `overview.json`: data range + "predictions for the next 90 days"
- If scores are temporary (001 §8): small limitation note "Scores currently from Gradient Boosting; final model is Random Forest."

### 3.2 KPI tiles (4)

| Tile | Value (current data) | Context line | Click → |
|---|---|---|---|
| Customers | 4,338 | "with purchase history" | Customers |
| Likely to buy again | 62% | "chance ≥ 50% in the next 90 days" | Customers, filtered to ≥ 50% |
| Revenue at risk | £448K | "past spend of At-risk / lapsed customers (5%)" | At-risk / lapsed segment |
| Category opportunity | £883K | "estimated spend across all categories" | Categories |

Each tile has an ⓘ tooltip from the glossary (003 §6).

> **Pending re-run:** Category opportunity currently uses category scores for a past quarter (002 §6). Once the category model is re-scored as of the end of the data (002 §7), the value updates automatically. Until then the tooltip adds: "Based on an earlier prediction window."

### 3.3 Where to focus
- Two cards, one per focus segment (Occasional regulars, New & undecided), in segment order.
- Each card (a **Segment card**, 003 §5) shows, top to bottom:
  1. Segment badge + "Focus" tag
  2. **One-line description** of who they are (from `lib/segments.ts`)
  3. **Size:** customers, % of all customers, % of revenue
  4. **Typical customer:** chance of buying again, orders, last bought (medians from `segments.json`)
  5. Recommended action
  6. **Generate strategy** (opens assistant with "Give me a strategy for my {segment} customers")
- Card title links to the segment page.

Current values:

| | Occasional regulars | New & undecided |
|---|---|---|
| Description | Come back every so often. A nudge can turn them into regulars. | Bought once, recently. Could become regulars or drift away. |
| Customers | 1,480 (34%) | 874 (20%) |
| Revenue share | 19% | 5% |
| Chance of buying again | 63% | 43% |
| Orders | 3 | 1 |
| Last bought | 55 days ago | 72 days ago |

### 3.4 Segments
- Two horizontal bar charts side by side (not one dual-axis chart, 003 §4):
  - **Customers per segment**
  - **Revenue per segment** (with % share as a direct label)
- Bars in fixed segment order and colors; segment names as labels.
- Hover: exact count / £ and share. Click a bar → that segment page.
- "View as table" toggle.

Current data:

| Segment | Customers | Revenue | Share |
|---|---|---|---|
| Loyal regulars | 1,199 | £6.30M | 71% |
| Occasional regulars | 1,480 | £1.68M | 19% |
| New & undecided | 874 | £0.47M | 5% |
| At-risk / lapsed | 785 | £0.45M | 5% |

### 3.5 Top category opportunities
- Horizontal bars: top 5 categories by expected spend, single hue (003 §4).
- Direct label: £ expected spend. Hover adds likely buyers count.
- Click a bar → that category page. "See all categories →" link.

---

## 4. Data

| Section | Source (002) |
|---|---|
| Header, KPI tiles, segments | `overview.json` |
| Focus cards | `overview.json` + `lib/segments.ts` |
| Top categories | `categories.json` (sorted by `expected_spend`) |

All read on the server. No client-side data fetching on this page.

---

## 5. States

| State | Behavior |
|---|---|
| Loading | Skeleton tiles and chart placeholders (same size, no layout shift) |
| Data file missing | Error card: "Customer data hasn't been built yet. Run `build_data.py`." |
| Assistant unavailable | Generate buttons still show; the assistant page shows the error (000 FR-7) |

---

## 6. Responsive

- Desktop: tiles in a row of 4; segment charts side by side.
- Tablet (< 1024 px): tiles 2 × 2; segment charts stacked.

---

## 7. Acceptance criteria

- [ ] All four KPI values match `overview.json` and are formatted per 003 §6.
- [ ] Focus cards show exactly Occasional regulars and New & undecided, in segment order.
- [ ] Segment charts use segment colors from `lib/segments.ts`, in fixed order, with names visible.
- [ ] Clicking any tile, bar, or card title navigates to the right page (with filters applied where listed).
- [ ] Every chart has a working "View as table" toggle.
- [ ] Generate strategy buttons open the assistant with the question filled in.
- [ ] Works in light and dark mode; passes keyboard-only navigation.
- [ ] A new user can name the largest at-risk group and its action in under 2 minutes (000 §4).

---

## 8. Open questions

1. ~~Category opportunity tile~~ **Decided:** keep it, labeled as an estimate, pending the category re-run (§3.2).
