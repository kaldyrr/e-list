import type { NormalizedOffer } from "./types";

export type MarketPrice = {
  average: number;
  count: number;
  max: number;
  median: number;
  min: number;
  p25: number;
  p75: number;
  trimmedAverage: number;
};

export function calculateMarketPrice(offers: NormalizedOffer[]): MarketPrice | null {
  const prices = offers
    .filter((offer) => offer.confidence >= 65)
    .filter((offer) => offer.normalizedAvailability === "in_stock")
    .filter((offer) => !offer.isSuspicious)
    .map((offer) => offer.price)
    .filter((price): price is number => typeof price === "number")
    .sort((a, b) => a - b);

  if (!prices.length) {
    return null;
  }

  const min = prices[0] ?? 0;
  const max = prices.at(-1) ?? min;
  const trimmed = trimPrices(prices);

  return {
    average: Math.round(average(prices)),
    count: prices.length,
    max,
    median: Math.round(percentile(prices, 50)),
    min,
    p25: Math.round(percentile(prices, 25)),
    p75: Math.round(percentile(prices, 75)),
    trimmedAverage: Math.round(average(trimmed)),
  };
}

export function markPriceOutliers<T extends { isSuspicious: boolean; price?: number; suspiciousReasons: string[] }>(offers: T[]) {
  const prices = offers
    .map((offer) => offer.price)
    .filter((price): price is number => typeof price === "number")
    .sort((a, b) => a - b);

  if (prices.length < 5) {
    return offers;
  }

  const median = percentile(prices, 50);

  return offers.map((offer) => {
    if (!offer.price) {
      return offer;
    }

    if (offer.price < median * 0.65) {
      offer.isSuspicious = true;
      offer.suspiciousReasons.push("too_cheap");
    }

    if (offer.price > median * 1.8) {
      offer.isSuspicious = true;
      offer.suspiciousReasons.push("too_expensive");
    }

    return offer;
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const k = ((sorted.length - 1) * p) / 100;
  const floor = Math.floor(k);
  const ceil = Math.min(floor + 1, sorted.length - 1);

  if (floor === ceil) {
    return sorted[floor] ?? 0;
  }

  return (sorted[floor] ?? 0) + ((sorted[ceil] ?? 0) - (sorted[floor] ?? 0)) * (k - floor);
}

function trimPrices(prices: number[]) {
  if (prices.length < 10) {
    return prices;
  }

  const cut = Math.max(1, Math.floor(prices.length * 0.1));

  return prices.slice(cut, -cut);
}
