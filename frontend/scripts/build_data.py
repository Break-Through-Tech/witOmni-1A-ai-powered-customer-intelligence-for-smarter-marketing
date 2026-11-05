"""Build the dashboard's JSON data files from the model outputs (spec 002).

Run from the repo root:
    python frontend/scripts/build_data.py

Writes to frontend/data/ (everything except model_metrics.json, which is
hand-written). Same inputs always give byte-identical outputs.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA_IN = ROOT / "data"
OUT = ROOT / "frontend" / "data"

SCORES_CSV = DATA_IN / "model_outputs" / "repeat_purchase_scores.csv"
CATEGORY_SCORES_CSV = DATA_IN / "category_data" / "customer_per_category_scores.csv"
CATEGORY_META_JSON = DATA_IN / "category_data" / "customer_per_category_scores_meta.json"
STOCKCODE_CSV = DATA_IN / "category_data" / "stockcode_to_category.csv"
TRANSACTIONS_XLSX = DATA_IN / "Online Retail.xlsx"

# Notebook 5 segment names -> slugs (002 §4). Display names live in lib/segments.ts.
SEGMENT_SLUGS = {
    "High-probability active": "loyal-regulars",
    "Promising reactivation": "occasional-regulars",
    "Nurture": "new-and-undecided",
    "At-risk / lapsed": "at-risk-lapsed",
}
SEGMENT_ORDER = list(SEGMENT_SLUGS.values())
FOCUS_SEGMENTS = ["occasional-regulars", "new-and-undecided"]

LIKELY_BUYER = 0.5  # categories.json likely_buyers (002 §3.5)
LIKELY_NEW_BUYER = 0.3  # never bought + this probability (002 §3.6)
LIST_CAP = 500  # max customers per category list
LEAN_MIN = 1.10  # 005 §3.6
LEAN_MIN_BUYERS = 20  # customers with p >= 0.3 in the segment
EXPECTED_CATEGORIES = 27
MIN_MAPPED_SHARE = 0.95

FEATURES = [
    "recency_days",
    "customer_age_days",
    "invoice_count",
    "total_spend",
    "total_items",
    "unique_products",
    "avg_order_value",
    "mean_order_gap_days",
    "product_diversity_ratio",
    "repeat_purchase_rate",
]


class CheckFailed(Exception):
    pass


def check(condition: bool, message: str) -> None:
    if not condition:
        raise CheckFailed(message)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower().replace("'", "")).strip("-")


def money(x: float) -> float:
    return round(float(x), 2)


def prob(x: float) -> float:
    return round(float(x), 4)


def write_json(path: Path, obj, compact: bool = False) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    else:
        text = json.dumps(obj, sort_keys=True, indent=2, ensure_ascii=False)
    path.write_text(text + "\n", encoding="utf-8", newline="\n")
    return path.stat().st_size


# ---------------------------------------------------------------- loading


def load_scores() -> pd.DataFrame:
    s = pd.read_csv(SCORES_CSV)
    unknown = set(s["marketing_segment"]) - set(SEGMENT_SLUGS)
    check(not unknown, f"Unknown marketing_segment values: {sorted(unknown)}")
    check(s["CustomerID"].is_unique, "Duplicate CustomerID in repeat scores")
    p = s["repeat_purchase_probability"]
    check(p.between(0, 1).all(), "repeat_purchase_probability outside 0-1")
    s["CustomerID"] = s["CustomerID"].astype(int)
    s["segment"] = s["marketing_segment"].map(SEGMENT_SLUGS)
    return s


def load_category_scores(category_names: set[str]) -> pd.DataFrame:
    # The header's £ sign isn't valid UTF-8, so read by position.
    c = pd.read_csv(CATEGORY_SCORES_CSV, encoding="latin-1")
    check(c.shape[1] == 4, f"Expected 4 columns in category scores, got {c.shape[1]}")
    c.columns = ["CustomerID", "category", "p", "expected_spend"]
    c["CustomerID"] = c["CustomerID"].astype(int)
    unknown = set(c["category"]) - category_names
    check(not unknown, f"Categories in scores not in stockcode map: {sorted(unknown)}")
    check(c["p"].between(0, 1).all(), "Category buy probability outside 0-1")
    check(
        not c.duplicated(["CustomerID", "category"]).any(),
        "Duplicate customer x category rows in category scores",
    )
    return c


def load_transactions(stock_map: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    raw = pd.read_excel(TRANSACTIONS_XLSX)
    report = {"raw_rows": len(raw)}
    df = raw.drop_duplicates()
    report["dropped_duplicates"] = len(raw) - len(df)
    n = len(df)
    df = df.dropna(subset=["CustomerID"])
    report["dropped_no_customer"] = n - len(df)
    n = len(df)
    df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]
    report["dropped_cancellations"] = n - len(df)
    n = len(df)
    df = df[(df["Quantity"] > 0) & (df["UnitPrice"] > 0)].copy()
    report["dropped_nonpositive"] = n - len(df)
    df["CustomerID"] = df["CustomerID"].astype(int)
    df["TotalPrice"] = df["Quantity"] * df["UnitPrice"]

    # Rule 6: StockCode as text on both sides before joining.
    df["stock_key"] = df["StockCode"].astype(str).str.strip().str.upper()
    df = df.merge(stock_map[["stock_key", "category"]], on="stock_key", how="left")
    mapped = df["category"].notna().mean()
    report["mapped_share"] = round(float(mapped), 4)
    check(
        mapped >= MIN_MAPPED_SHARE,
        f"Only {mapped:.1%} of transaction rows map to a category (need {MIN_MAPPED_SHARE:.0%})",
    )
    report["clean_rows"] = len(df)
    return df, report


def load_stock_map() -> pd.DataFrame:
    m = pd.read_csv(STOCKCODE_CSV, dtype={"StockCode": str})
    m = m.rename(columns={"Category": "category"})
    m["stock_key"] = m["StockCode"].astype(str).str.strip().str.upper()
    m = m.drop_duplicates("stock_key")
    return m


def category_scores_current(scored_as_of: str) -> bool:
    if not CATEGORY_META_JSON.exists():
        return False
    meta = json.loads(CATEGORY_META_JSON.read_text(encoding="utf-8"))
    return meta.get("scored_as_of") == scored_as_of


# ---------------------------------------------------------------- building


def medians(frame: pd.DataFrame) -> dict:
    return {
        "recency_days": float(frame["recency_days"].median()),
        "invoice_count": float(frame["invoice_count"].median()),
        "total_spend": money(frame["total_spend"].median()),
        "avg_order_value": money(frame["avg_order_value"].median()),
    }


def build_segments(scores: pd.DataFrame, cat: pd.DataFrame) -> list[dict]:
    total_revenue = scores["total_spend"].sum()
    all_medians = medians(scores)
    cat = cat.merge(scores[["CustomerID", "segment"]], on="CustomerID", how="left")
    scored_ids = set(cat["CustomerID"])

    # Lean = category share of the segment's total buy probability / share overall.
    overall_share = cat.groupby("category")["p"].sum() / cat["p"].sum()

    out = []
    for slug in SEGMENT_ORDER:
        seg = scores[scores["segment"] == slug]
        seg_cat = cat[cat["segment"] == slug]

        by_cat = seg_cat.groupby("category").agg(
            expected_spend=("expected_spend", "sum"),
            likely_buyers=("p", lambda x: int((x >= LIKELY_BUYER).sum())),
        )
        top = by_cat.sort_values(["expected_spend"], ascending=False).head(5)
        top_categories = [
            {
                "category": name,
                "slug": slugify(name),
                "expected_spend": money(row.expected_spend),
                "likely_buyers": int(row.likely_buyers),
            }
            for name, row in top.iterrows()
        ]

        leans = []
        if len(seg_cat):
            share = seg_cat.groupby("category")["p"].sum() / seg_cat["p"].sum()
            lean = (share / overall_share).dropna()
            enough = seg_cat[seg_cat["p"] >= LIKELY_NEW_BUYER].groupby("category").size()
            lean = lean[lean.index.isin(enough[enough >= LEAN_MIN_BUYERS].index)]
            lean = lean[lean >= LEAN_MIN].sort_values(ascending=False).head(2)
            leans = [
                {"category": name, "slug": slugify(name), "lean": round(float(v), 3)}
                for name, v in lean.items()
            ]

        out.append(
            {
                "slug": slug,
                "customers": int(len(seg)),
                "customer_share": round(len(seg) / len(scores), 4),
                "revenue": money(seg["total_spend"].sum()),
                "revenue_share": round(float(seg["total_spend"].sum() / total_revenue), 4),
                "avg_probability": prob(seg["repeat_purchase_probability"].mean()),
                "medians": medians(seg),
                "all_customers_medians": all_medians,
                "top_categories": top_categories,
                "leans": leans,
                "no_category_scores": int((~seg["CustomerID"].isin(scored_ids)).sum()),
            }
        )
    return out


def build_overview(scores, cat, tx, segments, current: bool) -> dict:
    start = tx["InvoiceDate"].min().date()
    end = tx["InvoiceDate"].max().date()
    scored_as_of = (pd.Timestamp(end) + pd.Timedelta(days=1)).date().isoformat()
    by_slug = {s["slug"]: s for s in segments}
    rest = sorted(
        (s for s in SEGMENT_ORDER if s not in FOCUS_SEGMENTS),
        key=lambda s: -by_slug[s]["revenue"],
    )
    return {
        "data_range": {"start": start.isoformat(), "end": end.isoformat()},
        "scored_as_of": scored_as_of,
        "total_customers": int(len(scores)),
        "likely_to_repeat_pct": round(
            float((scores["repeat_purchase_probability"] >= 0.5).mean()), 4
        ),
        "revenue_at_risk": by_slug["at-risk-lapsed"]["revenue"],
        "expected_category_spend": money(cat["expected_spend"].sum()),
        "category_scores_current": current,
        "segments": [
            {
                "slug": s["slug"],
                "customers": s["customers"],
                "customer_share": s["customer_share"],
                "revenue": s["revenue"],
                "revenue_share": s["revenue_share"],
            }
            for s in segments
        ],
        # Action text lives in lib/segments.ts; this is only the order + counts.
        "top_actions": [
            {"segment": s, "customers": by_slug[s]["customers"]}
            for s in FOCUS_SEGMENTS + rest
        ],
    }


def customer_countries(tx: pd.DataFrame) -> pd.Series:
    counts = tx.groupby(["CustomerID", "Country"]).size().reset_index(name="n")
    counts = counts.sort_values(["CustomerID", "n", "Country"], ascending=[True, False, True])
    return counts.drop_duplicates("CustomerID").set_index("CustomerID")["Country"]


def build_customers(scores, cat, tx) -> tuple[list[dict], dict]:
    country = customer_countries(tx)
    bought = set(zip(tx["CustomerID"], tx["category"].dropna()))

    cat_sorted = cat.sort_values(
        ["CustomerID", "expected_spend", "category"], ascending=[True, False, True]
    )
    top5 = cat_sorted.groupby("CustomerID").head(5)
    top5_by_id: dict[int, list[dict]] = {}
    for row in top5.itertuples(index=False):
        top5_by_id.setdefault(row.CustomerID, []).append(
            {
                "category": row.category,
                "slug": slugify(row.category),
                "buy_probability": prob(row.p),
                "expected_spend": money(row.expected_spend),
                "already_buys": (row.CustomerID, row.category) in bought,
            }
        )

    # Monthly spend over the full data range, zeros included (006 §3.2).
    months = pd.period_range(tx["InvoiceDate"].min(), tx["InvoiceDate"].max(), freq="M")
    tx = tx.assign(month=tx["InvoiceDate"].dt.to_period("M"))
    monthly = tx.groupby(["CustomerID", "month"]).agg(
        spend=("TotalPrice", "sum"), orders=("InvoiceNo", "nunique")
    )
    monthly_by_id: dict[int, dict] = {}
    for (cid, month), row in monthly.iterrows():
        monthly_by_id.setdefault(cid, {})[month] = row

    rows, details = [], {}
    for r in scores.sort_values("CustomerID").itertuples(index=False):
        cid = int(r.CustomerID)
        tops = top5_by_id.get(cid)
        row = {
            "id": cid,
            "segment": r.segment,
            "probability": prob(r.repeat_purchase_probability),
            "recency_days": int(r.recency_days),
            "invoice_count": int(r.invoice_count),
            "total_spend": money(r.total_spend),
            "avg_order_value": money(r.avg_order_value),
            "country": country.get(cid),
            "top_category": tops[0]["category"] if tops else None,
        }
        rows.append(row)
        per_month = monthly_by_id.get(cid, {})
        details[str(cid)] = {
            **row,
            "features": {
                f: (round(float(getattr(r, f)), 4) if pd.notna(getattr(r, f)) else None)
                for f in FEATURES
            },
            "top_categories": tops,
            "monthly_spend": [
                {
                    "month": str(m),
                    "spend": money(per_month[m]["spend"]) if m in per_month else 0.0,
                    "orders": int(per_month[m]["orders"]) if m in per_month else 0,
                }
                for m in months
            ],
        }
    return rows, details


def build_categories(scores, cat, tx, category_names) -> tuple[list[dict], dict]:
    tx = tx[tx["category"].isin(category_names)]
    hist = tx.groupby("category").agg(
        buyers=("CustomerID", "nunique"), revenue=("TotalPrice", "sum")
    )
    bought = set(zip(tx["CustomerID"], tx["category"]))
    info = scores.set_index("CustomerID")[["segment", "recency_days"]]

    cat = cat.copy()
    cat["already_buys"] = [(i, c) in bought for i, c in zip(cat["CustomerID"], cat["category"])]
    pred = cat.groupby("category").agg(
        likely_buyers=("p", lambda x: int((x >= LIKELY_BUYER).sum())),
        expected_spend=("expected_spend", "sum"),
    )
    new_mask = (~cat["already_buys"]) & (cat["p"] >= LIKELY_NEW_BUYER)
    likely_new = cat[new_mask].groupby("category").size()

    summary = hist.join(pred, how="outer").fillna(0)
    summary["likely_new_buyers"] = likely_new.reindex(summary.index).fillna(0)
    # 1 = weakest; ties broken by name so ranks are stable.
    summary = summary.sort_index()
    summary["rank_by_buyers"] = summary["buyers"].rank(method="first").astype(int)
    summary["rank_by_revenue"] = summary["revenue"].rank(method="first").astype(int)

    categories, lists = [], {}
    for name, row in summary.sort_values("expected_spend", ascending=False).iterrows():
        slug = slugify(name)
        categories.append(
            {
                "slug": slug,
                "name": name,
                "buyers": int(row.buyers),
                "revenue": money(row.revenue),
                "likely_buyers": int(row.likely_buyers),
                "likely_new_buyers": int(row.likely_new_buyers),
                "expected_spend": money(row.expected_spend),
                "rank_by_buyers": int(row.rank_by_buyers),
                "rank_by_revenue": int(row.rank_by_revenue),
            }
        )

        rows = cat[cat["category"] == name].sort_values(
            ["expected_spend", "CustomerID"], ascending=[False, True]
        )

        def to_list(frame: pd.DataFrame) -> list[dict]:
            return [
                {
                    "id": int(x.CustomerID),
                    "segment": info.at[x.CustomerID, "segment"],
                    "buy_probability": prob(x.p),
                    "expected_spend": money(x.expected_spend),
                    "recency_days": int(info.at[x.CustomerID, "recency_days"]),
                }
                for x in frame.head(LIST_CAP).itertuples(index=False)
            ]

        existing = rows[rows["already_buys"]]
        new = rows[(~rows["already_buys"]) & (rows["p"] >= LIKELY_NEW_BUYER)]
        lists[slug] = {
            "slug": slug,
            "name": name,
            "existing_total": int(len(existing)),
            "likely_new_total": int(len(new)),
            "existing_buyers": to_list(existing),
            "likely_new_buyers": to_list(new),
        }

    check(
        len(categories) == EXPECTED_CATEGORIES,
        f"Expected {EXPECTED_CATEGORIES} categories, got {len(categories)}",
    )
    check(not any(c["name"] == "DROP" for c in categories), "DROP category leaked into output")
    return categories, lists


# ---------------------------------------------------------------- main


def main() -> int:
    print("Loading inputs...")
    stock_map = load_stock_map()
    category_names = set(stock_map["category"]) - {"DROP"}
    scores = load_scores()
    cat = load_category_scores(category_names)
    tx, report = load_transactions(stock_map)

    missing = set(cat["CustomerID"]) - set(scores["CustomerID"])
    check(not missing, f"{len(missing)} customers in category scores missing from repeat scores")

    print("Building...")
    segments = build_segments(scores, cat)
    end = tx["InvoiceDate"].max().date()
    scored_as_of = (pd.Timestamp(end) + pd.Timedelta(days=1)).date().isoformat()
    overview = build_overview(scores, cat, tx, segments, category_scores_current(scored_as_of))
    customers, details = build_customers(scores, cat, tx)
    categories, lists = build_categories(scores, cat, tx, category_names)

    # Remove stale per-category files before writing (keeps the folder exact).
    cat_dir = OUT / "category"
    if cat_dir.exists():
        for f in cat_dir.glob("*.json"):
            f.unlink()

    sizes = {
        "overview.json": write_json(OUT / "overview.json", overview),
        "segments.json": write_json(OUT / "segments.json", segments),
        "customers.json": write_json(OUT / "customers.json", customers, compact=True),
        "customer_details.json": write_json(
            OUT / "customer_details.json", details, compact=True
        ),
        "categories.json": write_json(OUT / "categories.json", categories),
    }
    cat_total = sum(
        write_json(cat_dir / f"{slug}.json", data, compact=True) for slug, data in lists.items()
    )
    sizes[f"category/*.json ({len(lists)} files)"] = cat_total

    no_scores = len(scores) - cat["CustomerID"].nunique()
    drop_buyers = tx.loc[tx["category"] == "DROP", "CustomerID"].nunique()
    print("\nReport")
    print(f"  Customers:                  {len(scores):,}")
    print(f"  Without category scores:    {no_scores:,} (expected ~989)")
    print(f"  Category scores current:    {overview['category_scores_current']}")
    print(f"  Raw transaction rows:       {report['raw_rows']:,}")
    for k in ("dropped_duplicates", "dropped_no_customer", "dropped_cancellations", "dropped_nonpositive"):
        print(f"    {k.replace('_', ' '):<26}{report[k]:,}")
    print(f"  Clean rows:                 {report['clean_rows']:,}")
    print(f"  Rows mapped to a category:  {report['mapped_share']:.1%}")
    print(f"  DROP category buyers (excluded): {drop_buyers:,}")
    print("  Output sizes:")
    for name, size in sizes.items():
        print(f"    {name:<34}{size / 1024:,.0f} KB")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except CheckFailed as e:
        print(f"\nCHECK FAILED: {e}", file=sys.stderr)
        sys.exit(1)
