// Tooltip text for terms (spec 003 §6). One place, used everywhere.
export const GLOSSARY = {
  chance:
    "How likely the customer buys again in the next 90 days, from our model.",
  expectedSpend: "Chance of buying × typical spend in that category.",
  aov: "Total spend ÷ number of orders.",
  segment:
    "Group of customers with similar chance of returning and recent activity.",
  precision: "Of customers we predict will return, the share who actually did.",
  recall: "Of customers who returned, the share we predicted.",
  rocAuc:
    "How well the model ranks returners above non-returners (0.5 = guessing, 1 = perfect).",
  revenueAtRisk:
    "Total past spend of At-risk / lapsed customers: what you stand to lose if they don't come back.",
  categoryOpportunity:
    "Estimated spend across all categories in the next 90 days: each customer's chance of buying a category × their typical spend there, added up.",
  customers: "Customers with at least one purchase and a customer ID.",
} as const;

export const EARLIER_WINDOW_NOTE = "Based on an earlier prediction window.";
