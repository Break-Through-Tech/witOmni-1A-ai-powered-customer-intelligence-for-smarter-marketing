"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, num } from "@/lib/format";

type Month = { month: string; spend: number; orders: number };

function label(month: string, long = false) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    year: long ? "numeric" : "2-digit",
    timeZone: "UTC",
  });
}

/** Monthly spend columns, single hue, zero months shown (006 §3.2). */
export function MonthlyChart({ data, ariaLabel }: { data: Month[]; ariaLabel: string }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className="rounded-[8px] border border-border bg-surface-1 p-4">
      <div className="mb-3 flex items-center justify-between">
        <figcaption className="text-sm font-medium">
          Monthly spend, {label(data[0].month, true)} – {label(data[data.length - 1].month, true)}
        </figcaption>
        <button type="button" className="text-xs text-accent hover:underline" aria-pressed={asTable} onClick={() => setAsTable((t) => !t)}>
          {asTable ? "View as chart" : "View as table"}
        </button>
      </div>
      {asTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-1.5 font-normal">Month</th>
              <th className="py-1.5 text-right font-normal">Orders</th>
              <th className="py-1.5 text-right font-normal">Spend</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.month} className="border-b border-border last:border-0">
                <td className="py-1.5">{label(m.month, true)}</td>
                <td className="py-1.5 text-right">{num(m.orders)}</td>
                <td className="py-1.5 text-right">{money(m.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div role="img" aria-label={ariaLabel}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
              <XAxis
                dataKey="month"
                tickFormatter={(m: string) => label(m)}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `£${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : `£${Math.round(v)}`
                }
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-0)" }}
                content={({ active, payload }) => {
                  const m = payload?.[0]?.payload as Month | undefined;
                  if (!active || !m) return null;
                  return (
                    <div className="rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                      <div className="font-medium text-primary">{label(m.month, true)}</div>
                      <div className="text-secondary">{money(m.spend)}</div>
                      <div className="text-secondary">
                        {num(m.orders)} {m.orders === 1 ? "order" : "orders"}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="spend" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
