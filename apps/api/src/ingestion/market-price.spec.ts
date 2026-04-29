import { describe, expect, it } from "vitest";
import { calculateMarketPrice, markPriceOutliers } from "./market-price";
import type { NormalizedOffer } from "./types";

describe("market price", () => {
  it("calculates median and typical range from trusted offers", () => {
    const offers = [64000, 66000, 67990, 71000, 76000].map((price, index) =>
      offer(price, index),
    );

    expect(calculateMarketPrice(offers)).toMatchObject({
      count: 5,
      median: 67990,
      p25: 66000,
      p75: 71000,
    });
  });

  it("marks extreme price outliers", () => {
    const offers = [10000, 62000, 64000, 66000, 68000, 140000].map((price, index) =>
      offer(price, index),
    );

    const marked = markPriceOutliers(offers);

    expect(marked[0]?.isSuspicious).toBe(true);
    expect(marked[0]?.suspiciousReasons).toContain("too_cheap");
    expect(marked[5]?.isSuspicious).toBe(true);
    expect(marked[5]?.suspiciousReasons).toContain("too_expensive");
  });
});

function offer(price: number, index: number): NormalizedOffer {
  return {
    collectedAt: new Date(0).toISOString(),
    confidence: 90,
    currency: "RUB",
    imageUrls: ["https://example.com/image.jpg"],
    isSuspicious: false,
    matchReasons: ["model_match"],
    matchScore: 90,
    normalizedAvailability: "in_stock",
    normalizedTitle: `offer ${index}`,
    price,
    rawSpecs: {},
    source: "test",
    sourceType: "large_retail",
    suspiciousReasons: [],
    title: `Offer ${index}`,
    url: `https://example.com/${index}`,
  };
}
