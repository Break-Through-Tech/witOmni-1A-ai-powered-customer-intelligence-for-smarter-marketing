# 009 — Model Insights & Limitations

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 §6.6, §9](000-product-spec.md), [001 §8](001-architecture.md), [002 §3.7](002-data-layer.md), [003](003-design-system.md) |
| **Route** | `/model` (linked from "How accurate is this?" in every page footer, 003 §2) |
| **Last updated** | 2026-11-05 |

---

## 1. Job of this page

Answer: **"Can I trust these numbers, and how should I use them?"**

Written for the business owner first. Technical detail is there, but collapsed (start small, 006 §2.1).

---

## 2. Page structure (top to bottom)

```
How accurate is this?

┌───────────────────────────────────────────────────────────┐
│ When we say a customer is likely to buy again, we're right │
│ about 3 in 4 times (73%).                                  │
│ Much better than guessing: the model ranks customers       │
│ correctly 75% of the time (guessing = 50%).                │
└───────────────────────────────────────────────────────────┘

How to read a score ────────────────────────────────────────
What makes a customer come back ───────────────────────────  top 5 bars
How many customers should I target? ───────────────────────  slider + line chart
What it predicts about categories ─────────────────────────  one sentence
Limitations ────────────────────────────────────────────────  plain list

For the technical team ▸   (collapsed: model comparison, baselines, cross-validation)
```

---

## 3. Sections

### 3.1 Headline answer
- Two sentences, filled from `model_metrics.json` for the **scoring model** (the one whose scores the dashboard uses):
  - Precision → "When we say a customer is likely to buy again, we're right about {n} in {d} times ({p}%)." (nearest simple fraction: 3 in 4, 4 in 5, …)
  - ROC-AUC → "The model ranks customers correctly {a}% of the time (guessing = 50%)."
- **Temporary model note, data-driven:** if `scoring_model` ≠ `final_model`, show the limitation note "Scores currently from {scoring_model}; final model is {final_model}." Same pattern as 002 §3.1: no one has to remember to remove it.

### 3.2 How to read a score
Short text + one example, no chart:
- "A score of 70% means customers like this one bought again about 7 times in 10 in the past."
- "Use scores to **rank** customers (who first), not as exact chances. The data includes a Christmas peak, so scores are likely a bit high."
- "Predictions cover the next 90 days."

### 3.3 What makes a customer come back
- Horizontal bars, single hue, sorted: **top 5** features by importance; "Show all 10" expands.
- Each bar uses the plain `label` from `model_metrics.json` plus a **direction word** from the logistic regression sign: "Bought recently ↑ more likely", "More orders ↑ more likely".
- One-line takeaway above: "Recent, frequent customers who buy a wide range of products are most likely to come back."
- Hover: importance value and a one-line explanation of the method.
- Features with importance ≤ 0 are hidden from the top 5 (they don't help).

Current top 5: Days since last purchase · Number of orders · Number of different products · Total spend · Share of products re-bought.

### 3.4 How many customers should I target?
- **Slider** over the 6 cut-offs in `threshold_tradeoff` (30%–80%). For the selected step, a sentence:
  - "Target customers with a {t}%+ score → you contact **{share}%** of customers, **{precision}%** of them buy again, and you reach **{recall}%** of everyone who would."
- Small line chart beneath: precision and recall (y) vs. share targeted (x), with the selected point marked. Two lines, one axis (0–100%), legend + direct labels (003 §4).
- Default step: 50% (matches "Likely to buy again" on the Overview).

### 3.5 What it predicts about categories
- One sentence from `category_propensity`: "Our top 5 category guesses for a customer include **{recall_at_5}%** of the categories they actually go on to buy."
- Plus: "Customers with no purchases before the model's cutoff don't get category predictions yet." (Shown while `category_scores_current` is false, 002 §3.1.)

### 3.6 Limitations
- The `limitations` list from `model_metrics.json`, as plain bullets. No rewriting in the page code, so it stays in one place.

### 3.7 For the technical team (collapsed)
- **Model comparison:** one small bar chart **per metric** (accuracy, precision, recall, F1, ROC-AUC), models as bars, scoring and final model tagged with text. No grouped multi-metric chart with different meanings on one axis.
- **Baselines:** recency only, random guess, shown as reference lines on the ROC-AUC chart.
- **Cross-validated ROC-AUC:** mean ± std per model, as a table.
- **Category models:** table of mean AUC and recall@5 (neural net, LightGBM, frequency baseline).
- Footnote: test set size (674) and "Differences of a few points are within noise."
- **Why not ~0.92?** One line: "Earlier notebooks scored ~0.92 predicting a 'High value loyal' label built from the same spending inputs (total quantity alone scores 0.90). This page uses a harder, honest target: whether the customer buys again in the next 90 days."

---

## 4. Data

Everything comes from `model_metrics.json` (hand-written, 002 §3.7) plus `category_scores_current` from `overview.json`. No numbers in page code.

When the RF switch happens (001 §8): update `scoring_model` and `threshold_tradeoff` in `model_metrics.json`. The headline, slider, and temporary note all update from that.

---

## 5. States

| State | Behavior |
|---|---|
| `model_metrics.json` missing or invalid | Error card: "Model details aren't available." Rest of dashboard unaffected |
| Loading | Skeletons |

---

## 6. Acceptance criteria

- [ ] Headline numbers match the scoring model's row in `model_metrics.json`.
- [ ] Temporary note shows only when `scoring_model` ≠ `final_model`.
- [ ] Feature chart shows top 5 with plain labels and direction words; "Show all 10" works.
- [ ] Slider sentence matches `threshold_tradeoff` at every step; default 50%.
- [ ] Technical section is collapsed by default; one chart per metric.
- [ ] Limitations match the JSON list exactly.
- [ ] Every page footer links here.
- [ ] Light/dark mode, keyboard-operable slider, "View as table" on every chart.

---

## 7. Open questions

None.
