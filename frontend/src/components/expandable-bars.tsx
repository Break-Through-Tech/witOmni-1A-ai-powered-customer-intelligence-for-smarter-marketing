"use client";

import { useState } from "react";
import { HBarChart, type HBarRow } from "./charts/hbar-chart";

/** Bar chart that shows the first N rows with a "Show all" toggle. */
export function ExpandableBars({
  title,
  rows,
  initial,
  ariaLabel,
  valueHeader,
  labelWidth,
  allLabel,
}: {
  title: string;
  rows: HBarRow[];
  /** Rows shown before expanding (may be fewer than `initial` if filtered upstream). */
  initial: HBarRow[];
  ariaLabel: string;
  valueHeader?: string;
  labelWidth?: number;
  allLabel: string;
}) {
  const [all, setAll] = useState(false);
  return (
    <div>
      <HBarChart
        title={title}
        rows={all ? rows : initial}
        ariaLabel={ariaLabel}
        valueHeader={valueHeader}
        labelWidth={labelWidth}
      />
      {rows.length > initial.length && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 text-sm text-accent hover:underline">
          {all ? "Show fewer" : allLabel}
        </button>
      )}
    </div>
  );
}
