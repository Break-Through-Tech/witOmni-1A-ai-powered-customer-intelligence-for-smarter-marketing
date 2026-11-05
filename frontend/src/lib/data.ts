// Server-only loaders for frontend/data/*.json (spec 002 §5).
// Pages and assistant tools both use these, so they always see the same data.
import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import type {
  CategoryDetail,
  CategorySummary,
  CustomerDetail,
  CustomerRow,
  ModelMetrics,
  Overview,
  SegmentStats,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

// Files are read once per server instance (002 §5).
const fileCache = new Map<string, Promise<unknown>>();

function readJson<T>(relative: string): Promise<T> {
  let entry = fileCache.get(relative);
  if (!entry) {
    entry = readFile(path.join(DATA_DIR, relative), "utf8").then(
      (text) => JSON.parse(text) as unknown,
    );
    // Don't cache failures: a missing file may be built later.
    entry.catch(() => fileCache.delete(relative));
    fileCache.set(relative, entry);
  }
  return entry as Promise<T>;
}

async function readJsonOrNull<T>(relative: string): Promise<T | null> {
  try {
    return await readJson<T>(relative);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

const SLUG = /^[a-z0-9-]+$/;

export async function getOverview(): Promise<Overview> {
  "use cache";
  cacheLife("max");
  return readJson<Overview>("overview.json");
}

export async function getSegments(): Promise<SegmentStats[]> {
  "use cache";
  cacheLife("max");
  return readJson<SegmentStats[]>("segments.json");
}

export async function getCustomers(): Promise<CustomerRow[]> {
  "use cache";
  cacheLife("max");
  return readJson<CustomerRow[]>("customers.json");
}

/** One customer's full profile, or null if the ID doesn't exist. */
export async function getCustomer(id: number): Promise<CustomerDetail | null> {
  "use cache";
  cacheLife("max");
  if (!Number.isInteger(id)) return null;
  const all = await readJson<Record<string, CustomerDetail>>(
    "customer_details.json",
  );
  return all[String(id)] ?? null;
}

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("max");
  return readJson<CategorySummary[]>("categories.json");
}

/** Ranked target lists for one category, or null if the slug doesn't exist. */
export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  "use cache";
  cacheLife("max");
  if (!SLUG.test(slug)) return null; // also blocks path tricks like "../"
  return readJsonOrNull<CategoryDetail>(path.join("category", `${slug}.json`));
}

export async function getModelMetrics(): Promise<ModelMetrics> {
  "use cache";
  cacheLife("max");
  return readJson<ModelMetrics>("model_metrics.json");
}
