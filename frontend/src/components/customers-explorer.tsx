"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  applyFilters,
  CHANCE,
  describe,
  type Filters,
  LAST_BOUGHT,
  NO_CATEGORY,
  parseFilters,
  SORTS,
  type SortKey,
  SPEND,
  spendCutoffs,
  toSearch,
} from "@/lib/customer-filters";
import { SEGMENTS } from "@/lib/segments";
import type { CustomerRow } from "@/lib/types";
import { CustomerList } from "./customer-list";

const select =
  "rounded-[6px] border border-border bg-surface-1 px-2 py-1.5 text-sm text-primary";

/** Customers page body (spec 006 §2). All state lives in the URL (000 FR-4). */
export function CustomersExplorer({
  customers,
  categories,
}: {
  customers: CustomerRow[];
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const f = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const [moreOpen, setMoreOpen] = useState(
    () => f.chance.length > 0 || !!f.country || !!f.category,
  );
  const [query, setQuery] = useState(f.q);

  const cut = useMemo(() => spendCutoffs(customers), [customers]);
  const rows = useMemo(() => applyFilters(customers, f, cut), [customers, f, cut]);
  const countries = useMemo(() => {
    const n = new Map<string, number>();
    for (const c of customers) if (c.country) n.set(c.country, (n.get(c.country) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [customers]);
  const ids = useMemo(() => new Set(customers.map((c) => String(c.id))), [customers]);

  const update = (patch: Partial<Filters>) =>
    router.replace(`${pathname}${toSearch({ ...f, ...patch })}`, { scroll: false });

  const chips: { label: string; clear: Partial<Filters> }[] = [];
  if (f.q) chips.push({ label: `ID starts ${f.q}`, clear: { q: "" } });
  if (f.segment)
    chips.push({ label: SEGMENTS.find((s) => s.slug === f.segment)?.name ?? f.segment, clear: { segment: "" } });
  if (f.last) chips.push({ label: `Bought ${LAST_BOUGHT[f.last as keyof typeof LAST_BOUGHT]}`, clear: { last: "" } });
  if (f.spend) chips.push({ label: SPEND[f.spend as keyof typeof SPEND].replace(/^in the /, ""), clear: { spend: "" } });
  for (const c of f.chance)
    chips.push({
      label: `${CHANCE[c as keyof typeof CHANCE]} chance`,
      clear: { chance: f.chance.filter((x) => x !== c) },
    });
  if (f.country) chips.push({ label: f.country, clear: { country: "" } });
  if (f.category)
    chips.push({
      label: f.category === NO_CATEGORY ? "Not enough history" : `Next: ${f.category}`,
      clear: { category: "" },
    });

  return (
    <div className="space-y-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.replace(/\D/g, "");
          if (ids.has(q)) router.push(`/customers/${q}`);
          else update({ q });
        }}
      >
        <label htmlFor="customer-search" className="sr-only">
          Find a customer by ID
        </label>
        <input
          id="customer-search"
          inputMode="numeric"
          placeholder="Find a customer by ID…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            update({ q: e.target.value.replace(/\D/g, "") });
          }}
          className="w-full max-w-sm rounded-[6px] border border-border bg-surface-1 px-3 py-2 text-sm"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-secondary">Sort by</span>
          <select className={select} value={f.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-secondary">Show</span>
        <select aria-label="Segment" className={select} value={f.segment} onChange={(e) => update({ segment: e.target.value })}>
          <option value="">Any segment</option>
          {SEGMENTS.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
        <select aria-label="Last bought" className={select} value={f.last} onChange={(e) => update({ last: e.target.value })}>
          <option value="">Any time</option>
          <option value="30">Last 30 days</option>
          <option value="90">1–3 months ago</option>
          <option value="180">3–6 months ago</option>
          <option value="older">6+ months ago</option>
        </select>
        <select aria-label="Spend" className={select} value={f.spend} onChange={(e) => update({ spend: e.target.value })}>
          <option value="">Any spend</option>
          <option value="top10">Top 10% by spend</option>
          <option value="tophalf">Top half by spend</option>
          <option value="bottomhalf">Bottom half by spend</option>
        </select>
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
          className="px-2 py-1.5 text-accent hover:underline"
        >
          More filters {moreOpen ? "▾" : "▸"}
        </button>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.replace(pathname, { scroll: false });
            }}
            className="px-2 py-1.5 text-secondary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {moreOpen && (
        <div className="flex flex-wrap items-center gap-4 rounded-[8px] border border-border bg-surface-1 p-3 text-sm">
          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="sr-only">Chance of buying again</legend>
            <span className="text-secondary">Chance of buying again</span>
            {Object.entries(CHANCE).map(([k, v]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={f.chance.includes(k)}
                  onChange={(e) =>
                    update({
                      chance: e.target.checked
                        ? [...f.chance, k].sort((a, b) => Object.keys(CHANCE).indexOf(a) - Object.keys(CHANCE).indexOf(b))
                        : f.chance.filter((x) => x !== k),
                    })
                  }
                />
                {v}
              </label>
            ))}
          </fieldset>
          <select aria-label="Country" className={select} value={f.country} onChange={(e) => update({ country: e.target.value })}>
            <option value="">Any country</option>
            {countries.map(([c, n]) => (
              <option key={c} value={c}>{c} ({n})</option>
            ))}
          </select>
          <select aria-label="Likely next category" className={select} value={f.category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">Any likely next category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={NO_CATEGORY}>Not enough history</option>
          </select>
        </div>
      )}

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.label}>
              <button
                type="button"
                onClick={() => {
                  if ("q" in c.clear) setQuery("");
                  update(c.clear);
                }}
                className="rounded-full border border-border bg-surface-1 px-3 py-1 text-xs hover:border-accent"
                aria-label={`Remove filter: ${c.label}`}
              >
                {c.label} ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {rows.length === 0 ? (
        <div className="rounded-[8px] border border-border bg-surface-1 p-8 text-center text-sm text-secondary">
          No customers match these filters.{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => {
              setQuery("");
              router.replace(pathname, { scroll: false });
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <CustomerList
          key={toSearch(f)}
          rows={rows}
          noun={describe(f)}
          exportName="customers"
          sort={f.sort}
          onSort={(s) => update({ sort: s })}
        />
      )}
    </div>
  );
}
