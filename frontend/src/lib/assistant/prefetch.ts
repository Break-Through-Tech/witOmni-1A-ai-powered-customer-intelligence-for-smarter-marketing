// "Look up first" for the Generate buttons (spec 008 §2): their questions name
// exactly what they're about, so the server fetches that data up front and the
// model can answer in one call instead of several.
import "server-only";

import { categoryLookup, customerLookup, segmentLookup } from "./lookups";

const SEGMENT_Q = /^give me a strategy for my (.+?) customers$/i;
const CUSTOMER_Q = /^give me a strategy for customer (\d+)$/i;
const CATEGORY_Q = /^give me a campaign for (.+)$/i;

export async function prefetchFor(question: string): Promise<string | undefined> {
  const q = question.trim().replace(/[.?!]+$/, "");
  let data: unknown;
  let m: RegExpMatchArray | null;
  if ((m = q.match(SEGMENT_Q))) data = await segmentLookup(m[1]);
  else if ((m = q.match(CUSTOMER_Q))) data = await customerLookup(Number(m[1]));
  else if ((m = q.match(CATEGORY_Q))) data = await categoryLookup({ category: m[1], limit: 5 });
  else return undefined;
  if (data && typeof data === "object" && "error" in data) return undefined;
  return JSON.stringify(data);
}
