import { calculateMarketPrice, markPriceOutliers } from "./market-price";
import { matchProduct } from "./matching";
import { normalizeAvailability, normalizeText } from "./normalization";
import { buildSuspicionReasons, calculateConfidence } from "./scoring";
import type { NormalizedOffer, ParserRunResult, RawOffer, TargetProduct } from "./types";

export function runParserPipeline(target: TargetProduct, rawOffers: RawOffer[]): ParserRunResult {
  const normalized = rawOffers.map((offer) => normalizeOffer(target, offer));
  const deduped = deduplicateOffers(normalized);
  const withOutliers = markPriceOutliers(deduped);
  const acceptedOffers = withOutliers.filter(isAcceptedOffer);
  const rejectedOffers = withOutliers.filter((offer) => !isAcceptedOffer(offer));

  return {
    acceptedOffers,
    exclusions: summarizeExclusions(rejectedOffers),
    id: createRunId(target),
    marketPrice: calculateMarketPrice(acceptedOffers),
    offersAccepted: acceptedOffers.length,
    offersRejected: rejectedOffers.length,
    offersTotal: rawOffers.length,
    parsedAt: new Date().toISOString(),
    rejectedOffers,
    target,
  };
}

export function normalizeOffer(target: TargetProduct, offer: RawOffer): NormalizedOffer {
  const match = matchProduct(target, offer.title);
  const normalizedAvailability = normalizeAvailability(String(offer.availability ?? ""));
  const suspiciousReasons = buildSuspicionReasons(offer);
  const initial: NormalizedOffer = {
    ...offer,
    confidence: 0,
    isSuspicious: suspiciousReasons.length > 0,
    matchReasons: match.reasons,
    matchScore: match.score,
    matchStatus: match.status,
    normalizedAvailability,
    normalizedTitle: normalizeText(offer.title),
    suspiciousReasons,
  };

  return {
    ...initial,
    confidence: calculateConfidence(initial),
  };
}

function isAcceptedOffer(offer: NormalizedOffer) {
  return (
    offer.matchStatus === "exact" &&
    offer.confidence >= 65 &&
    offer.normalizedAvailability === "in_stock" &&
    !offer.isSuspicious &&
    typeof offer.price === "number"
  );
}

function deduplicateOffers(offers: NormalizedOffer[]) {
  const byFingerprint = new Map<string, NormalizedOffer>();

  for (const offer of offers) {
    const fingerprint = createOfferFingerprint(offer);
    const current = byFingerprint.get(fingerprint);

    if (!current || offer.confidence > current.confidence) {
      byFingerprint.set(fingerprint, offer);
    }
  }

  return [...byFingerprint.values()];
}

function createOfferFingerprint(offer: NormalizedOffer) {
  return [
    normalizeText(offer.source),
    normalizeText(offer.sellerName ?? ""),
    offer.normalizedTitle,
    String(offer.price ?? ""),
  ].join("|");
}

function summarizeExclusions(offers: NormalizedOffer[]) {
  const result: Record<string, number> = {};

  for (const offer of offers) {
    const reasons = getExclusionReasons(offer);

    for (const reason of reasons) {
      result[reason] = (result[reason] ?? 0) + 1;
    }
  }

  return result;
}

function getExclusionReasons(offer: NormalizedOffer) {
  const reasons: string[] = [];

  if (offer.matchStatus !== "exact") {
    reasons.push("match_reject");
  }

  if (offer.normalizedAvailability !== "in_stock") {
    reasons.push(`availability_${offer.normalizedAvailability}`);
  }

  if (offer.confidence < 65) {
    reasons.push("low_confidence");
  }

  if (typeof offer.price !== "number") {
    reasons.push("missing_price");
  }

  reasons.push(...offer.suspiciousReasons);

  return reasons.length ? reasons : ["unknown"];
}

function createRunId(target: TargetProduct) {
  const base = normalizeText(
    [target.category, target.brand, target.model, Object.values(target.specs).join(" ")].filter(Boolean).join(" "),
  )
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-я0-9-]/gi, "")
    .slice(0, 80);

  return `${base}-${Date.now()}`;
}
