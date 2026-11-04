# 001 — Architecture & Tech Stack

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Derives from** | [000 — Product Spec](000-product-spec.md) |
| **Last updated** | 2026-11-03 |

---

## 1. Decisions

| Area | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Full control over layout and charts; most polished result for the demo |
| Styling / components | **Tailwind CSS + shadcn/ui** | Clean, consistent UI fast; we own the component code |
| Charts | **Recharts** (via shadcn charts); D3 only if a chart needs it | Good defaults, fully customizable |
| Tables | **TanStack Table** | Sort, filter, paginate the 4,338-customer list |
| Data prep | **One Python script** (pandas) | Team already knows pandas; turns model CSVs into small JSON files |
| AI assistant | **Vercel AI SDK** with tool calling | Provider-agnostic; swap models with one env var |
| AI provider | **Free tier**, default **Google Gemini (Flash)** | Most generous free API with tool calling; Groq as backup |
| Hosting | **Vercel (free Hobby plan)** | Public link, auto-deploys from GitHub |

No separate backend server. Next.js API routes handle data lookups and the assistant.

---

## 2. How it fits together

```
model CSVs (data/)
      │  python frontend/scripts/build_data.py
      ▼
frontend/data/*.json   ← pre-aggregated, committed to repo
      │
      ├─► Pages (server components) ──► charts, tables  ──► browser
      │
      └─► API routes ──► assistant tools ◄── LLM (Gemini via AI SDK)
                                               ▲
                              user question ───┘
```

1. **Build step:** `build_data.py` reads the CSVs in `data/` and writes small JSON files. Re-run only when model outputs change.
2. **Pages** read JSON on the server and send only what the page needs to the browser.
3. **Assistant:** the user's question goes to `/api/assistant`. The LLM calls tools (000 §6.5), each tool reads the JSON, and the answer streams back.

---

## 3. Data files (output of `build_data.py`)

| File | Contents | Approx. size |
|---|---|---|
| `overview.json` | Headline KPIs, segment counts and revenue | tiny |
| `segments.json` | Per-segment stats, rules, recommended action | tiny |
| `customers.json` | One row per customer: scores, segment, behavior, top 5 categories | ~1 MB |
| `categories.json` | Per-category totals, buyer counts, low-purchase flag | tiny |
| `category/<slug>.json` | Ranked customers for one category, split into existing vs. likely new buyers | ~100 KB each |
| `model_metrics.json` | Model comparison metrics, feature importance, limitations. **Hand-written**, not generated; `build_data.py` must not overwrite it | tiny |

The 90k-row category file never reaches the browser whole (000 NFR-2).

---

## 4. Folder structure

```
frontend/
  specs/              ← these specs
  scripts/
    build_data.py     ← CSV → JSON
  data/               ← generated JSON (server-only)
  src/
    app/
      page.tsx                ← Overview
      segments/[slug]/        ← Segment pages
      customers/              ← Table + [id] profile
      categories/             ← Ranking + [slug] detail
      assistant/              ← Chat page
      model/                  ← Model insights & limitations
      api/assistant/route.ts  ← LLM + tool calling
    components/       ← UI, charts, tables
    lib/
      data.ts         ← typed loaders for data/*.json
      segments.ts     ← single source of segment names, colors, rules (000 NFR-7)
      tools.ts        ← assistant tool definitions
```

---

## 5. AI assistant setup

- Provider and model come from env vars: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`. Switching providers is a config change, not a code change.
- Tools in `lib/tools.ts` are plain functions with typed inputs, called through the AI SDK's built-in tool calling.
- **Stretch goal:** wrap the same tools as an MCP server. Keep tools free of UI code so this needs no rewrite.
- **Free-tier protection** (public link): simple per-visitor rate limit, a max number of tool calls per question, and a friendly "assistant is busy, try again" message when the quota runs out (000 FR-7).

---

## 6. Environments

| | Local | Production |
|---|---|---|
| Run | `npm run dev` | Vercel, auto-deploy on push to `main` (preview deploys for other branches) |
| Secrets | `.env.local` (git-ignored) | Vercel environment variables |
| Data | Run `build_data.py` once | Committed JSON in `frontend/data/` |

---

## 7. Open questions

1. ~~Who owns the API key?~~ **Decided:** Donald creates the free Gemini key and keeps it private (`.env.local` + Vercel env vars).
2. ~~Vercel account~~ **Decided:** Donald's personal Vercel account.
3. ~~Model metrics source~~ **Decided:** copied by hand into `frontend/data/model_metrics.json`. Update it by hand if models are retrained.
4. ~~Which repeat-purchase model is final?~~ **Decided:** the team chose **Random Forest**. Until its scores file is ready, the dashboard uses the current **Gradient Boosting** scores (`repeat_purchase_scores.csv`). See §8.

---

## 8. Temporary: Gradient Boosting scores

- **Now:** repeat-purchase probabilities and segments come from Gradient Boosting (notebook 5).
- **Later:** switch to Random Forest. Steps:
  1. Export Random Forest scores for all customers in the same format as `repeat_purchase_scores.csv`.
  2. Apply the same segment rules (000 §5) to the Random Forest probabilities, so segments and scores come from one model.
  3. Re-run `build_data.py` and update `model_metrics.json` (`scoring_model`).
- No frontend code changes needed.
- Until the switch, the Model insights page shows a note: *"Scores currently from Gradient Boosting; final model is Random Forest."*
