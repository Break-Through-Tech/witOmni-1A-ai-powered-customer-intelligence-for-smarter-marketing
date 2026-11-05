"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HBarRow {
  key: string;
  label: string;
  value: number;
  /** Direct label at the end of the bar. */
  valueLabel: string;
  /** Extra lines in the hover tooltip. */
  details?: string[];
  /** CSS color; defaults to the accent (single hue). */
  color?: string;
  href?: string;
}

const ROW_HEIGHT = 36;

/**
 * Horizontal bar chart (003 §4): thin bars, 4 px rounded data-ends,
 * direct value labels in text color, hover tooltip, click-through,
 * and a "View as table" toggle.
 */
export function HBarChart({
  title,
  rows,
  ariaLabel,
  valueHeader = "Value",
  labelWidth = 150,
}: {
  title: string;
  rows: HBarRow[];
  /** One-sentence takeaway for screen readers (003 §7). */
  ariaLabel: string;
  valueHeader?: string;
  labelWidth?: number;
}) {
  const router = useRouter();
  const [asTable, setAsTable] = useState(false);

  return (
    <figure className="rounded-[8px] border border-border bg-surface-1 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <figcaption className="text-sm font-medium">{title}</figcaption>
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          aria-pressed={asTable}
          onClick={() => setAsTable((t) => !t)}
        >
          {asTable ? "View as chart" : "View as table"}
        </button>
      </div>

      {asTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-1.5 font-normal">Name</th>
              <th className="py-1.5 text-right font-normal">{valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border last:border-0">
                <td className="py-1.5">
                  {r.href ? (
                    <a href={r.href} className="text-accent hover:underline">
                      {r.label}
                    </a>
                  ) : (
                    r.label
                  )}
                </td>
                <td className="py-1.5 text-right">{r.valueLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div role="img" aria-label={ariaLabel}>
          <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + 8}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 128, bottom: 0, left: 0 }}
              barCategoryGap={2}
              className={rows.some((r) => r.href) ? "cursor-pointer" : ""}
              // Whole row is the hit target, bigger than the thin bar.
              onClick={(state) => {
                const i = Number(state?.activeTooltipIndex);
                const href = Number.isInteger(i) ? rows[i]?.href : undefined;
                if (href) router.push(href);
              }}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="label"
                width={labelWidth}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-0)" }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as HBarRow | undefined;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                      <div className="font-medium text-primary">{row.label}</div>
                      <div className="text-secondary">{row.valueLabel}</div>
                      {row.details?.map((d) => (
                        <div key={d} className="text-secondary">
                          {d}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                barSize={14}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                {rows.map((r) => (
                  <Cell key={r.key} fill={r.color ?? "var(--accent)"} />
                ))}
                <LabelList
                  dataKey="valueLabel"
                  position="right"
                  style={{ fill: "var(--text-secondary)", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
