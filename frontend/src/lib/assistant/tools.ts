// Assistant tool definitions (spec 008 §4, §7). Thin wrappers over lookups.ts.
import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
  categoryLookup,
  customerLookup,
  lowCategoriesLookup,
  overviewLookup,
  resolveAudience,
  segmentLookup,
} from "./lookups";

export const strategyInput = z.object({
  audience_type: z.enum(["segment", "category", "customer"]).describe("Who the plan targets"),
  audience_key: z
    .string()
    .describe("Segment name, category name, or customer ID the plan targets"),
  new_buyers: z
    .boolean()
    .optional()
    .describe("For a category plan: true if it targets customers who haven't bought it yet"),
  objective: z.string().describe("One sentence"),
  channel: z.string().describe("Email, SMS, social, on-site, or mixed"),
  offer: z.string().describe('A concrete offer, or "No discount"'),
  message_angle: z.string().describe("One sentence"),
  timing: z.string().describe("When and why"),
  success_metric: z.string().describe("One measurable thing over the next 90 days"),
  draft_subject: z.string().describe("Email subject line"),
  draft_body: z.string().describe("At most 120 words. Use {first_name} as the greeting placeholder."),
});

export type StrategyInput = z.infer<typeof strategyInput>;

export const assistantTools = {
  get_overview: tool({
    description:
      "Headline numbers for the whole business: customers, chance of buying again, revenue at risk, segment sizes, top categories, and the list of all category names.",
    inputSchema: z.object({}),
    execute: async () => overviewLookup(),
  }),
  get_segment_summary: tool({
    description:
      "Size, revenue, typical customer, recommended action, and likely categories for one segment.",
    inputSchema: z.object({
      segment: z
        .string()
        .describe("Loyal regulars, Occasional regulars, New & undecided, or At-risk / lapsed"),
    }),
    execute: async ({ segment }) => segmentLookup(segment),
  }),
  get_customer: tool({
    description: "One customer's chance of buying again, segment, behavior, and likely next categories.",
    inputSchema: z.object({ customer_id: z.number().int().describe("Customer ID, e.g. 12347") }),
    execute: async ({ customer_id }) => customerLookup(customer_id),
  }),
  top_customers_for_category: tool({
    description:
      "Best customers to target for one product category, ranked by expected spend, split into likely new buyers and existing buyers.",
    inputSchema: z.object({
      category: z.string().describe("Category name, e.g. Christmas"),
      segment: z.string().optional().describe("Optional segment filter"),
      new_buyers_only: z.boolean().optional().describe("Only customers who haven't bought it yet"),
      limit: z.number().int().min(1).max(20).optional().describe("How many customers (default 10)"),
    }),
    execute: async (args) => categoryLookup(args),
  }),
  low_purchase_categories: tool({
    description: "The weakest product categories by number of buyers or by revenue.",
    inputSchema: z.object({
      by: z.enum(["buyers", "revenue"]).optional(),
      limit: z.number().int().min(1).max(10).optional(),
    }),
    execute: async ({ by, limit }) => lowCategoriesLookup(by, limit),
  }),
  present_strategy: tool({
    description:
      "Show the finished marketing plan to the user as a strategy card. Call this once, at the end, for any strategy, plan, or campaign request.",
    inputSchema: strategyInput,
    // The audience count comes from the data, never from the model (008 §6).
    execute: async (plan) => ({
      ...plan,
      audience: await resolveAudience(plan.audience_type, plan.audience_key, plan.new_buyers ?? true),
    }),
  }),
};
