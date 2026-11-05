"use client";

import { useId, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Step = { threshold: number; share_targeted: number; precision: number; recall: number };

const P = (v: number) => `${Math.round(v * 100)}%`;
// First two validated categorical slots (003 §3); no segments on this page.
const PRECISION = "#2a78d6";
const RECALL = "#eb6834";

/** "How many customers should I target?" slider + trade-off chart (009 §3.4). */
export function ThresholdExplorer({ steps, defaultThreshold = 0.5 }: { steps: Step[]; defaultThreshold?: number }) {
  const sorted = [...steps].sort((a, b) => a.threshold - b.threshold);
  const start = Math.max(0, sorted.findIndex((s) => Math.abs(s.threshold - defaultThreshold) < 1e-9));
  const [i, setI] = useState(start);
  const id = useId();
  const s = sorted[i];
  const data = [...sorted]
    .sort((a, b) => a.share_targeted - b.share_targeted)
    .map((d) => ({ ...d, share: Math.round(d.share_targeted * 100), p: Math.round(d.precision * 100), r: Math.round(d.recall * 100) }));

  return (
    <div className="rounded-[8px] border border-border bg-surface-1 p-4">
      <label htmlFor={id} className="text-sm font-medium">
        Contact customers with a score of at least <span className="tabular-nums">{P(s.threshold)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={sorted.length - 1}
        step={1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
        aria-valuetext={`${P(s.threshold)} or higher`}
        className="mt-3 w-full accent-[var(--accent)]"
      />
      <div className="flex justify-between text-xs text-muted" aria-hidden>
        {sorted.map((d) => (
          <span key={d.threshold}>{P(d.threshold)}</span>
        ))}
      </div>
      <p className="mt-4 text-sm" aria-live="polite">
        Target customers with a <strong>{P(s.threshold)}+</strong> score → you contact{" "}
        <strong>{P(s.share_targeted)}</strong> of customers, <strong>{P(s.precision)}</strong> of them buy
        again, and you reach <strong>{P(s.recall)}</strong> of everyone who would.
      </p>

      <div className="mt-4" role="img" aria-label={`Contacting more customers reaches more buyers but fewer of them buy: at ${P(s.threshold)}, ${P(s.precision)} buy again and you reach ${P(s.recall)} of buyers.`}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 48, bottom: 16, left: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="share"
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              label={{ value: "Share of customers contacted", position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as (Step & { share: number }) | undefined;
                if (!active || !d) return null;
                return (
                  <div className="rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                    <div className="font-medium text-primary">Score {P(d.threshold)}+ · contact {d.share}%</div>
                    <div className="text-secondary">{P(d.precision)} of them buy again</div>
                    <div className="text-secondary">Reach {P(d.recall)} of buyers</div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)", paddingTop: 8 }} verticalAlign="top" align="right" />
            <ReferenceLine x={Math.round(s.share_targeted * 100)} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <Line name="Of those contacted, share who buy" dataKey="p" stroke={PRECISION} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
            <Line name="Share of all buyers reached" dataKey="r" stroke={RECALL} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
