# 003 — Design System

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 — Product Spec](000-product-spec.md), [001 — Architecture](001-architecture.md) |
| **Last updated** | 2026-11-03 |

---

## 1. Principles

1. **Answer first.** Every page opens with the one thing the user needs to know, then the detail.
2. **Every number has a next step.** A KPI or chart links to the segment, category, or assistant prompt that acts on it (000 Goal 2).
3. **Plain language.** No jargon without a tooltip (000 NFR-1).
4. **Calm, not flashy.** Neutral surfaces, color only where it carries meaning.
5. **Light and dark mode**, both designed (not auto-inverted).

---

## 2. Layout

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │  Page title            [Ask assistant]  │
│          ├─────────────────────────────────────────┤
│ Overview │  Filters (one row, when the page has any)│
│ Segments │  KPI tiles                               │
│ Customers│  Main chart(s)                           │
│ Categories│ Table / lists                           │
│ Assistant│                                          │
│ Model    │                                          │
└──────────┴─────────────────────────────────────────┘
```

- **Sidebar:** fixed on desktop, collapses to a menu button under 1024 px.
- **Ask assistant** button in the header on every page; opens the assistant with the current page's context pre-filled.
- **"How accurate is this?"** link in the footer of every page → Model insights (000 §4 Trust).
- Content max width ~1280 px, 24 px page padding (16 px on tablet).
- 12-column grid; KPI tiles in a row of 4 (2 on tablet).

---

## 3. Tokens

Defined once as CSS variables (Tailwind theme), swapped for dark mode.

### Surfaces and text

| Token | Light | Dark |
|---|---|---|
| `--surface-0` (page) | `#f6f6f4` | `#111110` |
| `--surface-1` (cards, charts) | `#fcfcfb` | `#1a1a19` |
| `--border` | `#e4e3df` | `#2e2e2b` |
| `--text-primary` | `#0b0b0b` | `#f0efec` |
| `--text-secondary` | `#52514e` | `#c3c2b7` |
| `--text-muted` | `#7a7974` | `#8f8e87` |
| `--accent` (links, primary buttons) | `#2a78d6` | `#3987e5` |

### Segment colors

Fixed order, validated for colorblind safety (light and dark, side-by-side use). **Segments always appear in this order** everywhere, since the order is part of what makes them safe.

| # | Segment | Light | Dark |
|---|---|---|---|
| 1 | High-probability active | `#2a78d6` blue | `#3987e5` |
| 2 | Promising reactivation ⭐ | `#eb6834` orange | `#d95926` |
| 3 | Nurture ⭐ | `#1baf7a` aqua | `#199e70` |
| 4 | At-risk / lapsed | `#eda100` yellow | `#c98500` |

⭐ = focus segment (000 §6.2), shown with a small "Focus" badge, never a different color.

**Rules**
- Colors live only in `lib/segments.ts` (002 §5). Never hard-code them.
- A segment is **never shown by color alone**: always with its name (label, legend, or badge).
- Light-mode aqua and yellow are low-contrast on white, so charts using them must have **visible labels or a table view**.
- **No scatter plots colored by all 4 segments** (the 4 colors can't all be told apart when scattered). Use one segment at a time, or small multiples.
- Status colors (good / warning / critical) are separate and only for system states (errors, quota), always with an icon + text.

### Other color jobs

| Job | Use |
|---|---|
| Magnitude (heatmap, probability bars) | One hue, light → dark blue |
| A single series (e.g. revenue over time) | `--accent` blue |
| "Already buys" vs "likely new buyer" | Blue vs neutral gray, plus a text label |

### Type and spacing

- Font: **Inter** (UI), tabular numbers for all figures.
- Sizes: 12 / 14 (body) / 16 / 20 / 24 / 32 (hero numbers).
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Radius: 8 px cards, 6 px inputs and buttons.

---

## 4. Charts

### Which chart for which job

| Data | Chart | Page |
|---|---|---|
| Headline number (total customers, revenue at risk) | **KPI tile**, not a chart | Overview |
| Customers and revenue per segment | Horizontal bars, segment colors | Overview, Segments |
| Segment vs. all customers (recency, orders, spend) | Paired bars, segment color vs. gray | Segment page |
| Category ranking (expected spend, buyers, revenue) | Horizontal bars, single hue, sorted | Categories |
| Customer's top 5 categories | Horizontal bars, single hue, with % labels | Customer profile |
| Customer monthly spend | Column chart over months, single hue | Customer profile |
| Model comparison | Grouped bars per metric, one chart per metric | Model insights |
| Precision vs. share targeted | Line chart | Model insights |
| Feature importance | Horizontal bars, sorted | Model insights |

**No pie or donut charts** (bars are easier to compare). **No dual-axis charts**: two measures means two charts.

### Mark and axis style

- Bars: thin, 4 px rounded ends, 2 px gap between bars.
- Lines: 2 px. Markers ≥ 8 px.
- Gridlines light and recessive; no chart borders.
- Labels in text colors, never in the segment color.
- Direct labels on key values only, not on every bar.
- Legend whenever there are 2+ series.

### Interaction

- **Hover tooltip on every chart:** exact value, formatted, plus segment/category name.
- **Click-through:** clicking a segment bar opens that segment; clicking a category opens that category.
- Every chart has a **"View as table"** toggle (accessibility, and the light-mode contrast relief above).

---

## 5. Components

| Component | Notes |
|---|---|
| **KPI tile** | Label, big number, one-line context ("of 4,338 customers"), optional link |
| **Segment badge** | Color dot + name; "Focus" tag for focus segments |
| **Probability display** | "72%" + thin bar; tooltip: "Chance this customer buys again in the next 90 days" |
| **Data table** | TanStack Table: sort, filter, paginate (50/page), sticky header, CSV export button |
| **Filter bar** | One row above content: segment, probability range, country, category |
| **Recommended action card** | Segment's action in plain text + "Generate strategy" button |
| **Strategy card** | Assistant output: objective, channel, offer, message angle, timing, success metric, draft message, Copy button |
| **Chat panel** | Message list, streaming responses, "Looking up data…" while tools run, suggested starter questions |
| **Empty / missing state** | Friendly text, e.g. "Not enough history for category predictions" (000 FR-6) |
| **Error state** | Status icon + text + retry; never blocks the rest of the page (000 FR-7) |
| **Info tooltip** | ⓘ icon next to any term in the glossary (§6) |
| **Limitation note** | Small muted callout, e.g. the temporary Gradient Boosting note (001 §8) |

---

## 6. Words and numbers

### Formatting

| Value | Format | Example |
|---|---|---|
| Money | £, thousands separator; no decimals over £1,000 | £2,322 · £744.19 |
| Large money | Short form in tiles, full in tooltips | £6.3M |
| Probability | Whole % | 72% |
| Counts | Thousands separator | 1,480 customers |
| Days | "N days ago" | 13 days ago |
| Dates | Day Month Year | 9 Dec 2011 |

### Glossary (tooltip text)

| Term | Tooltip |
|---|---|
| Chance of buying again | How likely the customer buys again in the next 90 days, from our model |
| Expected spend | Chance of buying × typical spend in that category |
| Average order value | Total spend ÷ number of orders |
| Segment | Group of customers with similar chance of returning and recent activity |
| Precision | Of customers we predict will return, the share who actually did |
| Recall | Of customers who returned, the share we predicted |
| ROC-AUC | How well the model ranks returners above non-returners (0.5 = guessing, 1 = perfect) |

### Tone

Short, direct, second person ("Your at-risk customers…"). Recommendations as verbs ("Send…", "Offer…"). No exclamation marks.

---

## 7. Accessibility checklist

- WCAG AA contrast for all text.
- Segment identity never color-only (name always present).
- Every chart has a table view.
- Full keyboard navigation; visible focus ring.
- Charts have an `aria-label` summarizing the takeaway.
- Respects reduced-motion settings.

---

## 8. Open questions

1. ~~Branding~~ **Decided:** Witomni branding. Logo in the sidebar header, Witomni's brand color replaces `--accent`. Segment colors don't change.
   - **Needed:** logo file (SVG preferred) and brand color hex from Witomni (ask the challenge advisor).
   - The brand color must pass 4.5:1 contrast on both surfaces for link text; if it doesn't, use a darker/lighter step of it for text and keep the original for buttons.
   - Until assets arrive, use the neutral blue accent and a text "Witomni" wordmark.
