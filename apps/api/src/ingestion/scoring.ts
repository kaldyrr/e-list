import { findBadWords, normalizeAvailability, normalizeText } from "./normalization";
import type { NormalizedOffer, RawOffer } from "./types";

const sourceWeights = {
  aggregator: 0.5,
  classified: 0.2,
  known_specialist: 0.85,
  large_retail: 1,
  marketplace: 0.75,
  small_shop: 0.6,
  social: 0,
} as const;

export function calculateConfidence(offer: Pick<NormalizedOffer, "availability" | "confidence" | "isSuspicious" | "matchScore" | "sellerName" | "sourceType" | "price">) {
  let confidence = sourceWeights[offer.sourceType] * 40;

  if (offer.price) {
    confidence += 15;
  }

  if (normalizeAvailability(String(offer.availability ?? "")) === "in_stock") {
    confidence += 15;
  }

  if (offer.matchScore >= 70) {
    confidence += 25;
  } else if (offer.matchScore >= 50) {
    confidence += 10;
  }

  if (offer.sellerName) {
    confidence += 5;
  }

  if (offer.isSuspicious) {
    confidence -= 40;
  }

  return clampScore(confidence);
}

export function buildSuspicionReasons(offer: RawOffer) {
  const reasons = [...findBadWords(offer.title, offer.description)];
  const normalizedTitle = normalizeText(offer.title);

  if (!offer.imageUrls.length) {
    reasons.push("missing_images");
  }

  if (normalizedTitle.length < 8) {
    reasons.push("short_title");
  }

  if (offer.sourceType === "marketplace") {
    if (!offer.sellerName) {
      reasons.push("missing_seller");
    }

    if (typeof offer.sellerRating === "number" && offer.sellerRating < 4.5) {
      reasons.push("low_seller_rating");
    }

    if (typeof offer.reviewsCount === "number" && offer.reviewsCount < 50) {
      reasons.push("low_reviews_count");
    }
  }

  return reasons;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
