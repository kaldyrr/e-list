import type { ProductSort } from "@elist/shared";

export type ProductQuery = {
  category?: string;
  limit?: string;
  offset?: string;
  search?: string;
  sort?: ProductSort;
};
