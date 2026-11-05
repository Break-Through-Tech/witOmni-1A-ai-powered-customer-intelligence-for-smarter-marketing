// Number formatting rules from spec 003 §6.

const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat("en-GB");

/** £2,322 over £1,000; £744.19 below. */
export function money(value: number): string {
  return Math.abs(value) >= 1000 ? gbp0.format(value) : gbp2.format(value);
}

/** Short form for tiles: £448K, £6.3M. */
export function moneyShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `£${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `£${Math.round(value / 1_000)}K`;
  return gbp0.format(value);
}

function trim(n: number): string {
  return n.toFixed(n >= 10 ? 1 : 2).replace(/\.?0+$/, "");
}

/** 0.6176 → "62%". */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function num(value: number): string {
  return count.format(Math.round(value));
}

export function daysAgo(days: number): string {
  const d = Math.round(days);
  if (d === 0) return "today";
  return d === 1 ? "1 day ago" : `${num(d)} days ago`;
}

export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
