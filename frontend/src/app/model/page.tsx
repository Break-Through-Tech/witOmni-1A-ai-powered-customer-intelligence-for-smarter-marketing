import { HBarChart, type HBarRow } from "@/components/charts/hbar-chart";
import { ThresholdExplorer } from "@/components/charts/threshold-explorer";
import { ExpandableBars } from "@/components/expandable-bars";
import { LimitationNote } from "@/components/limitation-note";
import { PageHeader } from "@/components/page-header";
import { getModelMetrics, getOverview } from "@/lib/data";
import { num, pct } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import type { ModelResult } from "@/lib/types";

/** Nearest simple fraction, smallest denominator first: 0.734 → "3 in 4". */
function simpleFraction(p: number): string {
  for (let d = 2; d <= 10; d++) {
    const n = Math.round(p * d);
    if (n > 0 && Math.abs(n / d - p) < 0.03) return `${n} out of ${d}`;
  }
  return `${Math.round(p * 10)} out of 10`;
}

const METRICS: { key: keyof ModelResult; title: string; tip?: string }[] = [
  { key: "roc_auc", title: "ROC-AUC (ranking quality)", tip: GLOSSARY.rocAuc },
  { key: "precision", title: "Precision", tip: GLOSSARY.precision },
  { key: "recall", title: "Recall", tip: GLOSSARY.recall },
  { key: "f1", title: "F1 (balance of precision and recall)" },
  { key: "accuracy", title: "Accuracy" },
];

// Model insights & limitations (spec 009).
export default async function ModelPage() {
  const [m, overview] = await Promise.all([getModelMetrics(), getOverview()]);
  const rp = m.repeat_purchase;
  const scoring = rp.test_results.find((r) => r.model === rp.scoring_model);
  const coef = new Map(rp.direction.items.map((d) => [d.feature, d.coefficient]));

  const featureRows: HBarRow[] = [...rp.feature_importance.items]
    .sort((a, b) => b.auc_drop - a.auc_drop)
    .map((f) => {
      const c = coef.get(f.feature) ?? 0;
      const helps = f.auc_drop > 0;
      return {
        key: f.feature,
        label: f.label,
        value: Math.max(f.auc_drop, 0),
        valueLabel: !helps ? "no effect" : c >= 0 ? "raises the chance" : "lowers the chance",
        details: [
          `Importance: ${f.auc_drop.toFixed(4)} (drop in ROC-AUC when shuffled)`,
          c >= 0 ? "When this goes up, customers are more likely to buy again." : "When this goes up, customers are less likely to buy again.",
        ],
      };
    });
  const top5 = featureRows.filter((r) => r.value > 0).slice(0, 5);
  const top3 = top5.slice(0, 3).map((r) => r.label.toLowerCase());

  const tag = (model: string) =>
    model === rp.scoring_model && model === rp.final_model
      ? `${model} (used)`
      : model === rp.scoring_model
        ? `${model} (scores now)`
        : model === rp.final_model
          ? `${model} (final)`
          : model;

  const category = m.category_propensity.results[0];

  return (
    <>
      <PageHeader title="How accurate is this?" />

      {rp.scoring_model !== rp.final_model && (
        <LimitationNote>
          Scores currently from {rp.scoring_model}; final model is {rp.final_model}.
        </LimitationNote>
      )}

      {scoring && (
        <section className="rounded-[8px] border border-border bg-surface-1 p-6">
          <p className="text-xl leading-snug">
            When we say a customer is likely to buy again, we&apos;re right about{" "}
            <strong>{simpleFraction(scoring.precision!)}</strong> times ({pct(scoring.precision!)}).
          </p>
          <p className="mt-2 text-secondary">
            The model ranks customers correctly {pct(scoring.roc_auc)} of the time (guessing = 50%).
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">How to read a score</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
          <li>A score of 70% means customers like this one bought again about 7 times in 10 in the past.</li>
          <li>
            Use scores to <strong className="text-primary">rank</strong> customers (who first), not as exact
            chances. The data includes a Christmas peak, so scores are likely a bit high.
          </li>
          <li>Predictions cover the next 90 days.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What makes a customer come back</h2>
        {top3.length >= 3 && (
          <p className="mt-1 mb-4 text-sm text-secondary">
            The strongest signals are {top3[0]}, {top3[1]} and {top3[2]}.
          </p>
        )}
        <ExpandableBars
          title="Most important signals"
          rows={featureRows}
          initial={top5}
          valueHeader="Direction"
          labelWidth={230}
          allLabel={`Show all ${featureRows.length}`}
          ariaLabel={`${top5[0]?.label} matters most for predicting repeat purchases.`}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">How many customers should I target?</h2>
        <ThresholdExplorer steps={rp.threshold_tradeoff.items} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">What it predicts about categories</h2>
        <p className="text-sm">
          Our top 5 category guesses for a customer include <strong>{pct(category.recall_at_5)}</strong> of
          the categories they actually go on to buy.
        </p>
        {!overview.category_scores_current && (
          <p className="mt-1 text-sm text-secondary">
            Customers with no purchases before the model&apos;s cutoff don&apos;t get category predictions yet.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Limitations</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
          {m.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <details className="rounded-[8px] border border-border bg-surface-1 p-4">
          <summary className="cursor-pointer text-sm font-medium">For the technical team</summary>

          <p className="mt-4 text-sm text-secondary">Target: {rp.target}.</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {METRICS.map((metric) => {
              const rows: HBarRow[] = rp.test_results
                .filter((r) => r[metric.key] != null)
                .map((r) => ({
                  key: r.model,
                  label: tag(r.model),
                  value: r[metric.key] as number,
                  valueLabel: (r[metric.key] as number).toFixed(3),
                  details: metric.tip ? [metric.tip] : undefined,
                }));
              // Baselines sit in the same chart, in gray, so models can be judged against them.
              for (const b of rp.baselines) {
                const v = b[metric.key];
                if (typeof v === "number")
                  rows.push({ key: b.model, label: `${b.model} (baseline)`, value: v, valueLabel: v.toFixed(3), color: "var(--neutral-bar)" });
              }
              const best = [...rows].sort((a, b) => b.value - a.value)[0];
              return (
                <HBarChart
                  key={metric.key}
                  title={metric.title}
                  rows={rows}
                  valueHeader={metric.title}
                  labelWidth={210}
                  ariaLabel={`${metric.title}: best is ${best.label} at ${best.valueLabel}.`}
                />
              );
            })}
          </div>

          <h3 className="mt-6 mb-2 text-sm font-medium">Cross-validated ROC-AUC</h3>
          <table className="w-full max-w-md text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-1.5 font-normal">Model</th>
                <th className="py-1.5 text-right font-normal">Mean</th>
                <th className="py-1.5 text-right font-normal">± std</th>
              </tr>
            </thead>
            <tbody>
              {rp.cross_validated_roc_auc.map((r) => (
                <tr key={r.model} className="border-b border-border last:border-0">
                  <td className="py-1.5">{tag(r.model)}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.mean.toFixed(3)}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.std.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-6 mb-2 text-sm font-medium">Category models</h3>
          <table className="w-full max-w-md text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-1.5 font-normal">Model</th>
                <th className="py-1.5 text-right font-normal">Mean AUC</th>
                <th className="py-1.5 text-right font-normal">Recall@5</th>
              </tr>
            </thead>
            <tbody>
              {m.category_propensity.results.map((r) => (
                <tr key={r.model} className="border-b border-border last:border-0">
                  <td className="py-1.5">{r.model}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.mean_auc.toFixed(3)}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.recall_at_5.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 space-y-2 text-xs text-muted">
            <p>
              Test set: {num(rp.test_set_size)} customers. Differences of a few points are within noise.
            </p>
            <p>
              <strong className="text-secondary">Why not ~0.92?</strong> Earlier notebooks scored ~0.92 predicting a
              &ldquo;High value loyal&rdquo; label built from the same spending inputs (total quantity alone scores
              0.90). This page uses a harder, honest target: whether the customer buys again in the next 90 days.
            </p>
          </div>
        </details>
      </section>
    </>
  );
}
