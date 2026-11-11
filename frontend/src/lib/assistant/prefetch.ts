// "Look up first" for the Generate buttons (spec 008 §2): their questions name
// exactly what they're about, so the server fetches that data up front and the
// model can answer in one call instead of several.
import "server-only";

import { categoryLookup, customerLookup, segmentLookup } from "./lookups";
import type { Source } from "./sources";

const SEGMENT_Q = /^give me a strategy for my (.+?) customers$/i;
const CUSTOMER_Q = /^give me a strategy for customer (\d+)$/i;
const CATEGORY_Q = /^give me a campaign for (.+)$/i;

export interface Prefetched {
  /** The lookup result as JSON, for the prompt. */
  json: string;
  /** Where it came from, so the chat can check citations against it. */
  source: Source;
}

export async function prefetchFor(question: string): Promise<Prefetched | undefined> {
  const q = question.trim().replace(/[.?!]+$/, "");
  let data: Awaited<ReturnType<typeof segmentLookup | typeof customerLookup | typeof categoryLookup>>;
  let m: RegExpMatchArray | null;
  if ((m = q.match(SEGMENT_Q))) data = await segmentLookup(m[1]);
  else if ((m = q.match(CUSTOMER_Q))) data = await customerLookup(Number(m[1]));
  else if ((m = q.match(CATEGORY_Q))) data = await categoryLookup({ category: m[1], limit: 5 });
  else return undefined;
  if ("error" in data) return undefined;
  return { json: JSON.stringify(data), source: data.source };
}
