export const FAQ_CATEGORIES = [
  "trade",
  "account",
  "payment",
  "pickup",
  "etc",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];
