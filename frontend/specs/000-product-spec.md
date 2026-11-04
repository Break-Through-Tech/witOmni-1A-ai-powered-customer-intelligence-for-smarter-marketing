# 000 — Product Spec: Customer Intelligence Dashboard

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Owner** | Donald Reith (@bananadonn) |
| **Branch** | `frontend` |
| **Last updated** | 2026-11-03 |
| **Role** | Source of truth. Every other spec in `frontend/specs/` derives from this one and must not contradict it. |

---

## 1. Purpose

Witomni helps founder-led companies grow with AI-powered marketing. Our models turn raw transaction history into predictions: who is likely to buy again, which marketing segment each customer belongs to, and which product categories each customer is likely to buy next.

Right now those predictions only exist as CSVs and notebooks. **The dashboard turns them into something a business owner can use without a data scientist:** see the health of their customer base at a glance, understand which customers to focus on, and get a concrete, personalized marketing strategy for each group or customer.

**One-sentence pitch:** *Know who will buy again, what they'll buy, and what to send them.*

---

## 2. Users

| User | Who they are | What they need from the dashboard |
|---|---|---|
| **Founder / owner** (primary) | Runs a small e-commerce business, not technical, limited time and budget | A quick read on customer health and a short list of "do this next" actions |
| **Marketing lead** (primary) | Plans and runs campaigns (email, promos, loyalty) | Target lists by segment and category, plus copy/strategy ideas they can act on |
| **Witomni consultant** (secondary) | Advises the business | A clear way to walk a client through the insights and justify recommendations |
| **Project reviewers** (secondary) | Challenge advisor, AI Studio coach, demo audience | Evidence the model works, how it was evaluated, and its limitations |

---

## 3. Goals

1. **Make the predictions understandable.** A non-technical user can explain what a segment means and why a customer is in it.
2. **Make the predictions actionable.** Every insight comes with a recommended next step.
3. **Personalize strategy.** Generate marketing recommendations tailored to a segment or a single customer, using their scores, behavior, and top categories.
4. **Be honest about the model.** Show performance and limitations so users trust it the right amount.
5. **Demo-ready by the November final delivery.**

### Non-goals (for v1)

- Sending emails or running campaigns from the dashboard (we recommend; the business executes).
- Retraining models from the UI, or live data pipelines.
- Multi-tenant accounts / onboarding real client data.
- Editing customer records.

---

## 4. Success criteria

| Criterion | How we know |
|---|---|
| Time to first insight | A new user can name the largest at-risk segment and its recommended action in under 2 minutes |
| Actionability | Every segment, customer, and category view has a recommended action or a "generate strategy" path |
| Coverage | All 4 marketing segments and all 27 product categories are browsable |
| Trust | Model metrics and a limitations section are reachable from every page in one click |
| Stretch goal met | LLM-generated personalized recommendations working for segments and individual customers |

---

## 5. Data we already have

The dashboard reads the model outputs below. It does **not** re-run models.

| File | Grain | Key fields | Powers |
|---|---|---|---|
| `data/model_outputs/repeat_purchase_scores.csv` | 1 row per customer (4,338) | `repeat_purchase_probability`, `marketing_segment`, `recommended_action`, recency, tenure, invoice count, total spend, AOV, order gap, product diversity, repeat rate | Overview, segments, customer profiles |
| `data/model_outputs/repeat_purchase_split.csv` | 1 row per customer | `repeat_purchase_90d` (actual label), train/test split, cutoff date `2011-09-10` | Model performance page |
| `data/category_data/customer_per_category_scores.csv` | customer × category (~90k rows) | `Buy probability`, `Expected spend (£)` | Category opportunities, customer "likely next buys" |
| `data/category_data/customer_category_scores.csv` | 1 row per customer (3,349), 27 category columns | Probability matrix | Heatmaps / category comparison |
| `data/category_data/stockcode_to_category.csv` | 1 row per product | `StockCode` → `Category` | Product drill-down |
| `data/Online Retail.xlsx` | raw transactions | invoices, products, country, dates | Historical trends, country breakdown |

### The 4 marketing segments (from the model)

> **Temporary:** probabilities and segments currently come from **Gradient Boosting**. The team's final model is **Random Forest**; we switch once its scores are exported (see 001 §8).

The **only** customer grouping in the dashboard. Assigned by rules in `notebooks_models/5-final_model_comparison.ipynb`, checked in order:

1. **Loyal regulars:** repeat probability ≥ 70% **and** last purchase ≤ 45 days ago
2. **Occasional regulars:** repeat probability ≥ 50%
3. **At-risk / lapsed:** last purchase > 180 days ago
4. **New & undecided:** everyone else

| Segment | Customers | Chance of return | Last bought | Orders | Spend | Revenue | Recommended action |
|---|---|---|---|---|---|---|---|
| Loyal regulars | 1,199 | 85% | 13 days | 7 | £2,322 | 71% | Recommend complementary products or loyalty benefits; avoid unnecessary discounts |
| Occasional regulars | 1,480 | 63% | 55 days | 3 | £744 | 19% | Send personalised reminders and a time-limited incentive |
| New & undecided | 874 | 43% | 72 days | 1 | £259 | 5% | Use low-cost content and product discovery messages |
| At-risk / lapsed | 785 | 36% | 267 days | 1 | £272 | 5% | Test win-back messaging, cap spend, and measure incremental lift |

*Chance of return is the mean; other behavior columns are medians.*

**Display names.** The dashboard uses friendlier names than the notebook. The CSV keeps the original names; the build script translates them (002 §2).

| Notebook / CSV name | Dashboard name | Who they are |
|---|---|---|
| High-probability active | **Loyal regulars** | 76% have 5+ orders; last bought ~2 weeks ago |
| Promising reactivation | **Occasional regulars** | 74% have 2–4 orders; last bought ~2 months ago |
| Nurture | **New & undecided** | 78% bought once; became customers ~2–3 months ago |
| At-risk / lapsed | **At-risk / lapsed** | 79% bought once; last bought ~9 months ago |

> The team's K-means personas (Loyal, One-timer, New Shopper, Regular) closely match these segments and are **not** used in the dashboard. They stay in the presentation as supporting analysis.

> **Known gap:** category scores cover 3,349 customers vs. 4,338 in the repeat-purchase scores. Confirmed cause: the category model only scores customers who bought before its cutoff date. The UI must handle customers with no category data (see §8).

---

## 6. Core capabilities

Each item below becomes its own derived spec (see §10).

### 6.1 Overview (home)
- KPI tiles: total customers, % likely to repeat, revenue at risk (spend of at-risk/lapsed), expected category spend.
- Segment distribution chart.
- "Top 3 actions this week": the highest-impact recommended actions with customer counts.

### 6.2 Segments
- One view per segment: size, share of revenue, average behavior (recency, AOV, frequency) compared with the overall base.
- What defines the segment, in plain language.
- Recommended action plus a **Generate strategy** button (§6.5).
- Customers within a segment can be sorted by repeat-purchase probability.
- **Focus segments:** Occasional regulars and New & undecided (high value potential, low frequency). Highlighted on the overview and segment pages.
- Export the segment's customer list (CSV).

### 6.3 Customers
- Searchable, sortable, filterable table: by segment, probability range, spend, recency, country, top category.
- **Customer profile:** repeat-purchase probability, segment, key behavior metrics, top 5 likely categories with expected spend, purchase history timeline, and a **Generate strategy** button.

### 6.4 Category opportunities
- Ranking of the 27 categories by total expected spend and number of likely buyers.
- **Low-purchase categories:** a toggle switches between **fewest buyers** and **least revenue**; the bottom 5 for the selected view are flagged so the business can grow them.
- Per category, two target lists:
  - **Existing buyers:** customers who already buy it (recommend more items).
  - **Likely new buyers:** customers who haven't bought it yet with a buy probability of at least 30% (cross-sell; see 002 §3.6 for why 30%).
- Customers are ranked **highest first by Expected spend (£)** from the category model. No extra multiplication by repeat-purchase probability; the category score already accounts for whether they return.
- Filter by segment. This answers "who should get the Christmas campaign?"
- Export the target list.

### 6.5 Strategy assistant (LLM, stretch goal)
- **Chat-style:** the user just asks a question in plain English (e.g. "How do I win back lapsed customers before Christmas?"). They never type in data themselves.
- **The LLM fetches its own data** by calling tools over the model outputs, then writes the strategy. Starting tool set:
  - `get_segment_summary(segment)`: size, behavior, revenue, recommended action
  - `get_customer(customer_id)`: scores, segment, behavior, top categories
  - `top_customers_for_category(category, segment?, new_buyers_only?, limit)`: ranked by Expected spend (£)
  - `low_purchase_categories(limit)`: weakest categories by buyers and revenue
  - `get_overview()`: headline KPIs
- The tools are plain functions in our backend, called through built-in tool calling.
- **Stretch goal:** wrap the same tools as an **MCP server** so they also work from Claude Desktop or other clients.
- **Generate strategy** buttons on segment, customer, and category pages open the assistant with the question pre-filled.
- The LLM receives **only aggregated or anonymized model outputs** (scores, segment, behavior metrics, top categories), never raw PII.
- Output: a short, structured plan (objective, channel, offer, message angle, timing, success metric) plus a draft message.
- Recommendations must stay consistent with the model's recommended action for that segment (e.g. no deep discounts for Loyal regulars).
- Users can regenerate and copy the result.

### 6.6 Model insights and limitations
- Model comparison (logistic regression, random forest / decision tree, gradient boosting) with precision, recall, F1, and ROC-AUC.
- Feature importance: which behaviors drive repeat purchase.
- How to read a probability score.
- Assumptions and limitations (§9) in plain language.

---

## 7. Key user journeys

1. **"How healthy is my customer base?"** Overview → segment chart → click the At-risk segment → see revenue at risk and the recommended action.
2. **"Who should I target this week?"** Overview → top actions → segment → export list.
3. **"What should I say to them?"** Segment → Generate strategy → copy the plan and draft message.
4. **"What do I promote next?"** Category opportunities → pick a category → likely buyers by segment → export.
5. **"Tell me about this customer."** Customers → search an ID → profile → likely next buys → Generate strategy.
6. **"Can I trust this?"** Any page → Model insights → metrics and limitations.

---

## 8. Requirements

### Functional
- **FR-1** Every page uses the model output files in §5 as its only source of predictions.
- **FR-2** All money is shown in GBP (£), matching the dataset.
- **FR-3** Probabilities are shown as percentages, with a short tooltip explaining them.
- **FR-4** Filters on the customers table persist while the user navigates within a session.
- **FR-5** Segment, category, and filtered customer lists can be exported as CSV.
- **FR-6** Customers without category scores show "Not enough history for category predictions" instead of blanks or zeros.
- **FR-7** The strategy generator handles LLM errors and timeouts gracefully and never blocks the rest of the dashboard.

### Non-functional
- **NFR-1 Usability:** written for non-technical users. No unexplained jargon (AOV, ROC-AUC, and similar terms get tooltips).
- **NFR-2 Performance:** pages load in under 2 s. The ~90k-row category file must be pre-aggregated or paginated, not shipped whole to the browser.
- **NFR-3 Accessibility:** WCAG AA color contrast, colorblind-safe segment palette, keyboard navigable.
- **NFR-4 Responsive:** usable on a laptop; readable on a tablet.
- **NFR-5 Privacy:** only CustomerIDs are shown (no names or emails exist in the data). LLM prompts never include raw transaction rows.
- **NFR-6 Secrets:** LLM API keys live server-side or in env vars, never in frontend code or the repo.
- **NFR-7 Consistency:** segment names, colors, and definitions are identical everywhere (single shared config).

---

## 9. Assumptions and limitations (shown to users)

- Data is historical (Dec 2010 – Dec 2011) from one UK online gift retailer. Predictions describe that business, not the user's own.
- Many customers are wholesalers, so spend and order sizes are higher than typical B2C.
- "Repeat purchase" means buying again within 90 days of the 2011-09-10 cutoff.
- Scores are probabilities, not guarantees. They should rank and prioritize customers, not decide alone.
- Category predictions need purchase history; newer customers may have none.
- LLM strategies are suggestions and need human review before use.

---

## 10. Derived specs (to be written)

| # | Spec | Covers |
|---|---|---|
| 001 | Architecture & tech stack | Framework, backend/API vs. static, hosting, LLM provider |
| 002 | Data layer | Loading and pre-aggregating CSVs, shared schemas, segment config |
| 003 | Design system | Layout, navigation, colors, chart conventions, components |
| 004 | Overview page | §6.1 |
| 005 | Segments | §6.2 |
| 006 | Customers & profile | §6.3 |
| 007 | Category opportunities | §6.4 |
| 008 | Strategy assistant | §6.5: tools, prompt design, guardrails, output format |
| 009 | Model insights | §6.6 |

Rule: a derived spec may add detail but must not change goals, scope, or requirements here. If it needs to, update this spec first.

---

## 11. Open questions

1. ~~Tech stack~~ **Decided:** Next.js (001).
2. ~~LLM provider and budget~~ **Decided:** free tier, Gemini by default (001).
3. ~~Hosting~~ **Decided:** public link on Vercel (001).
4. ~~Final model~~ **Decided:** Random Forest. Gradient Boosting scores used until the switch (001 §8).
5. ~~Category coverage gap~~ **Resolved:** expected. The category model only scores customers with purchases before its cutoff.
6. ~~Demo framing~~ **Decided:** Witomni's tool for its founder-led clients; this retailer is the example data.
7. ~~Auth~~ **Decided:** no login for v1. Public data, anonymized IDs, rate limits protect the AI quota.
8. ~~Tool calling vs. MCP~~ **Decided:** built-in tool calling for v1. Exposing the tools as an MCP server is a stretch goal.
