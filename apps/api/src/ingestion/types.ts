export type ProductCategory =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "monitor"
  | "psu"
  | "ram"
  | "smartphone"
  | "ssd";

export type ProductCondition = "new" | "refurbished" | "unknown" | "used";

export type Availability = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export type SourceType =
  | "aggregator"
  | "classified"
  | "large_retail"
  | "marketplace"
  | "known_specialist"
  | "small_shop"
  | "social";

export type TargetProduct = {
  category: ProductCategory;
  brand?: string;
  model?: string;
  condition?: ProductCondition;
  region?: string;
  specs: Record<string, string | number | boolean | null | undefined>;
};

export type RawOffer = {
  source: string;
  sourceType: SourceType;
  externalId?: string;
  url: string;
  title: string;
  description?: string;
  price?: number;
  currency: "RUB";
  availability?: Availability | string;
  condition?: ProductCondition;
  region?: string;
  sellerName?: string;
  sellerRating?: number;
  reviewsCount?: number;
  imageUrls: string[];
  rawSpecs: Record<string, string>;
  collectedAt: string;
};

export type NormalizedOffer = RawOffer & {
  normalizedTitle: string;
  normalizedAvailability: Availability;
  matchScore: number;
  matchReasons: string[];
  confidence: number;
  isSuspicious: boolean;
  suspiciousReasons: string[];
};
