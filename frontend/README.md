# Witomni Customer Intelligence Dashboard

Next.js dashboard that turns the team's model outputs into insights and marketing strategies. Specs live in [`specs/`](specs/); start with [000](specs/000-product-spec.md).

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local   # add your own LLM_API_KEY (never commit it)
npm run dev                  # http://localhost:3000
```

## Data

The pages read JSON in `data/`, built from the model CSVs by `scripts/build_data.py` (spec 002). `data/model_metrics.json` is hand-written.
