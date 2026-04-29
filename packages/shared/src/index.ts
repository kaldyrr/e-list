export const APP_NAME = "E-List";

export const productSortOptions = [
  "popular",
  "price-asc",
  "price-desc",
  "rating",
] as const;

export type ProductSort = (typeof productSortOptions)[number];

export type Money = {
  amount: number;
  currency: "RUB";
};

export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  imageUrl: string;
  minPrice: Money;
  oldPrice?: Money;
  badges: string[];
};
