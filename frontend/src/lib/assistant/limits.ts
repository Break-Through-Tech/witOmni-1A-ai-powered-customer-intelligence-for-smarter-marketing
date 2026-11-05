// Free-tier protection (spec 008 §8). In-memory per server instance:
// best effort, good enough for a demo. Upgrade path: a shared KV store.
import "server-only";

const WINDOW_MS = 10 * 60 * 1000;
const PER_VISITOR = 10;
const PER_DAY = Number(process.env.ASSISTANT_DAILY_CAP ?? 300);

const visitors = new Map<string, number[]>();
let day = "";
let dayCount = 0;

export type LimitResult = { ok: true } | { ok: false; message: string };

export function checkLimits(visitor: string): LimitResult {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  if (dayCount >= PER_DAY) {
    return { ok: false, message: "The assistant is busy right now. The rest of the dashboard still works." };
  }
  const recent = (visitors.get(visitor) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_VISITOR) {
    return { ok: false, message: "You've asked a lot quickly. Try again in a few minutes." };
  }
  recent.push(now);
  visitors.set(visitor, recent);
  dayCount++;
  if (visitors.size > 5000) visitors.clear(); // keep memory bounded
  return { ok: true };
}
